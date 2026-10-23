import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

export interface CreditTransaction {
  id: string;
  amount: number; // e.g. -1 for file processed, +10 for daily bonus
  reason: string;
  timestamp: number;
  balanceAfter: number;
}

export interface UserCreditData {
  credits: number;
  creditsUsed: number;
  lastDailyBonusClaim?: number | null; // timestamp ms
  claimedPromoCodes: string[];
  transactions: CreditTransaction[];
  plan: 'free' | 'starter' | 'pro' | 'unlimited';
}

export const DEFAULT_INITIAL_CREDITS = 50;
export const DAILY_BONUS_AMOUNT = 10;
export const COST_PER_FILE = 1;

export const PROMO_CODES: Record<string, { credits: number; label: string }> = {
  'MELO2026': { credits: 50, label: '2026 Contributor Launch Special (+50 Credits)' },
  'WELCOME': { credits: 30, label: 'Welcome New Creator Grant (+30 Credits)' },
  'PROCREATOR': { credits: 100, label: 'Pro Contributor Pack (+100 Credits)' },
  'STOCKBOOST': { credits: 25, label: 'Microstock Booster (+25 Credits)' },
  'FREE10': { credits: 10, label: 'Instant Top-up (+10 Credits)' }
};

const getLocalKey = (uid: string) => `melo_user_credits_${uid}`;

export function getLocalUserCredits(uid: string): UserCreditData {
  try {
    const raw = localStorage.getItem(getLocalKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.credits === 'number') {
        return {
          credits: parsed.credits,
          creditsUsed: parsed.creditsUsed || 0,
          lastDailyBonusClaim: parsed.lastDailyBonusClaim || null,
          claimedPromoCodes: Array.isArray(parsed.claimedPromoCodes) ? parsed.claimedPromoCodes : [],
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          plan: parsed.plan || 'free'
        };
      }
    }
  } catch (e) {
    console.warn('Failed to read local credits cache:', e);
  }

  return {
    credits: DEFAULT_INITIAL_CREDITS,
    creditsUsed: 0,
    lastDailyBonusClaim: null,
    claimedPromoCodes: [],
    transactions: [
      {
        id: 'init_' + Date.now(),
        amount: DEFAULT_INITIAL_CREDITS,
        reason: 'Welcome Signup Gift',
        timestamp: Date.now(),
        balanceAfter: DEFAULT_INITIAL_CREDITS
      }
    ],
    plan: 'free'
  };
}

export function saveLocalUserCredits(uid: string, data: UserCreditData) {
  try {
    localStorage.setItem(getLocalKey(uid), JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to write local credits cache:', e);
  }
}

/**
 * Subscribes to real-time credit updates in Firestore with local cache fallback
 */
export function subscribeUserCredits(
  uid: string,
  onUpdate: (data: UserCreditData) => void
): () => void {
  if (!uid) {
    const fallback = getLocalUserCredits('guest');
    onUpdate(fallback);
    return () => {};
  }

  // Provide immediate cached response
  const cached = getLocalUserCredits(uid);
  onUpdate(cached);

  try {
    const userDocRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const docData = docSnap.data();
          const credits = typeof docData.credits === 'number' ? docData.credits : DEFAULT_INITIAL_CREDITS;
          const creditsUsed = typeof docData.creditsUsed === 'number' ? docData.creditsUsed : 0;
          const lastDailyBonusClaim = docData.lastDailyBonusClaim || null;
          const claimedPromoCodes = Array.isArray(docData.claimedPromoCodes) ? docData.claimedPromoCodes : [];
          const transactions = Array.isArray(docData.transactions) ? docData.transactions : cached.transactions;
          const plan = docData.plan || 'free';

          const updated: UserCreditData = {
            credits,
            creditsUsed,
            lastDailyBonusClaim,
            claimedPromoCodes,
            transactions,
            plan
          };

          saveLocalUserCredits(uid, updated);
          onUpdate(updated);

          // If credits field was missing in existing doc, initialize it
          if (docData.credits === undefined) {
            updateDoc(userDocRef, {
              credits: DEFAULT_INITIAL_CREDITS,
              creditsUsed: 0,
              updatedAt: serverTimestamp()
            }).catch(() => {});
          }
        } else {
          // Document does not exist yet; initialize it
          const initialData: UserCreditData = {
            credits: DEFAULT_INITIAL_CREDITS,
            creditsUsed: 0,
            lastDailyBonusClaim: null,
            claimedPromoCodes: [],
            transactions: [
              {
                id: 'init_' + Date.now(),
                amount: DEFAULT_INITIAL_CREDITS,
                reason: 'Welcome Signup Gift',
                timestamp: Date.now(),
                balanceAfter: DEFAULT_INITIAL_CREDITS
              }
            ],
            plan: 'free'
          };
          saveLocalUserCredits(uid, initialData);
          onUpdate(initialData);

          setDoc(
            userDocRef,
            {
              credits: DEFAULT_INITIAL_CREDITS,
              creditsUsed: 0,
              claimedPromoCodes: [],
              transactions: initialData.transactions,
              plan: 'free',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            },
            { merge: true }
          ).catch((err) => {
            console.warn('Could not initialize user credit doc in firestore:', err);
          });
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot error for user credits:', error);
        onUpdate(getLocalUserCredits(uid));
      }
    );

    return () => unsubscribe();
  } catch (error) {
    console.warn('Error subscribing to credits in Firestore:', error);
    onUpdate(cached);
    return () => {};
  }
}

/**
 * Deduct credits from user account
 */
export async function deductCredits(
  uid: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; remainingCredits: number; message?: string }> {
  const current = getLocalUserCredits(uid);
  if (current.credits < amount) {
    return {
      success: false,
      remainingCredits: current.credits,
      message: `Insufficient credits. You need ${amount} credits, but currently have ${current.credits}.`
    };
  }

  const newCredits = Math.max(0, current.credits - amount);
  const newCreditsUsed = current.creditsUsed + amount;
  const newTx: CreditTransaction = {
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    amount: -amount,
    reason,
    timestamp: Date.now(),
    balanceAfter: newCredits
  };

  const updatedTransactions = [newTx, ...(current.transactions || [])].slice(0, 50);

  const updated: UserCreditData = {
    ...current,
    credits: newCredits,
    creditsUsed: newCreditsUsed,
    transactions: updatedTransactions
  };

  saveLocalUserCredits(uid, updated);

  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      credits: newCredits,
      creditsUsed: newCreditsUsed,
      transactions: updatedTransactions,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Could not update credits in Firestore, saved locally:', err);
  }

  return {
    success: true,
    remainingCredits: newCredits
  };
}

/**
 * Add credits to user account (Bonuses, Top-ups, Promo codes)
 */
export async function addCredits(
  uid: string,
  amount: number,
  reason: string,
  promoCode?: string
): Promise<{ success: boolean; newBalance: number }> {
  const current = getLocalUserCredits(uid);
  const newCredits = current.credits + amount;
  const claimedCodes = promoCode ? [...(current.claimedPromoCodes || []), promoCode.toUpperCase()] : current.claimedPromoCodes;

  const newTx: CreditTransaction = {
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    amount,
    reason,
    timestamp: Date.now(),
    balanceAfter: newCredits
  };

  const updatedTransactions = [newTx, ...(current.transactions || [])].slice(0, 50);

  const updated: UserCreditData = {
    ...current,
    credits: newCredits,
    claimedPromoCodes: claimedCodes,
    transactions: updatedTransactions
  };

  saveLocalUserCredits(uid, updated);

  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        credits: newCredits,
        claimedPromoCodes: claimedCodes,
        transactions: updatedTransactions,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not update credits in Firestore, saved locally:', err);
  }

  return { success: true, newBalance: newCredits };
}

/**
 * Check if daily bonus is ready to claim
 */
export function canClaimDailyBonus(lastClaimTimestamp?: number | null): { canClaim: boolean; timeRemainingMs: number } {
  if (!lastClaimTimestamp) {
    return { canClaim: true, timeRemainingMs: 0 };
  }
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - lastClaimTimestamp;
  if (elapsed >= ONE_DAY_MS) {
    return { canClaim: true, timeRemainingMs: 0 };
  }
  return { canClaim: false, timeRemainingMs: ONE_DAY_MS - elapsed };
}

/**
 * Claim daily bonus
 */
export async function claimDailyBonus(uid: string): Promise<{ success: boolean; creditsAdded: number; message: string; newBalance: number }> {
  const current = getLocalUserCredits(uid);
  const check = canClaimDailyBonus(current.lastDailyBonusClaim);

  if (!check.canClaim) {
    const hours = Math.ceil(check.timeRemainingMs / (1000 * 60 * 60));
    return {
      success: false,
      creditsAdded: 0,
      message: `Daily bonus already claimed. Please check back in ~${hours} hours.`,
      newBalance: current.credits
    };
  }

  const now = Date.now();
  const newCredits = current.credits + DAILY_BONUS_AMOUNT;

  const newTx: CreditTransaction = {
    id: 'tx_daily_' + now,
    amount: DAILY_BONUS_AMOUNT,
    reason: 'Daily Contributor Bonus (+10)',
    timestamp: now,
    balanceAfter: newCredits
  };

  const updatedTransactions = [newTx, ...(current.transactions || [])].slice(0, 50);

  const updated: UserCreditData = {
    ...current,
    credits: newCredits,
    lastDailyBonusClaim: now,
    transactions: updatedTransactions
  };

  saveLocalUserCredits(uid, updated);

  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        credits: newCredits,
        lastDailyBonusClaim: now,
        transactions: updatedTransactions,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not save daily bonus to Firestore, saved locally:', err);
  }

  return {
    success: true,
    creditsAdded: DAILY_BONUS_AMOUNT,
    message: `Success! Claimed +${DAILY_BONUS_AMOUNT} Daily Bonus Credits.`,
    newBalance: newCredits
  };
}

/**
 * Redeem promo code
 */
export async function redeemPromoCode(
  uid: string,
  rawCode: string
): Promise<{ success: boolean; creditsAdded: number; message: string; newBalance: number }> {
  const code = (rawCode || '').trim().toUpperCase();
  const current = getLocalUserCredits(uid);

  if (!code) {
    return { success: false, creditsAdded: 0, message: 'Please enter a valid promo code.', newBalance: current.credits };
  }

  if (current.claimedPromoCodes.includes(code)) {
    return { success: false, creditsAdded: 0, message: `Promo code "${code}" has already been redeemed by your account.`, newBalance: current.credits };
  }

  const promo = PROMO_CODES[code];
  if (!promo) {
    return { success: false, creditsAdded: 0, message: `Invalid or expired promo code: "${code}".`, newBalance: current.credits };
  }

  const result = await addCredits(uid, promo.credits, `Promo Code: ${code} (${promo.label})`, code);

  return {
    success: true,
    creditsAdded: promo.credits,
    message: `Awesome! Promo code "${code}" applied: +${promo.credits} Credits added!`,
    newBalance: result.newBalance
  };
}
