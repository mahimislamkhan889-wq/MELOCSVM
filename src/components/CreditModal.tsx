import React, { useState, useEffect } from 'react';
import { 
  X, 
  Coins, 
  Zap, 
  Gift, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Tag, 
  ShieldCheck, 
  History,
  TrendingUp,
  CreditCard,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserCreditData, 
  claimDailyBonus, 
  canClaimDailyBonus, 
  redeemPromoCode, 
  addCredits,
  PROMO_CODES,
  DAILY_BONUS_AMOUNT
} from '../services/creditService';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  userCredits: UserCreditData;
  onOpenAuth?: () => void;
  isLoggedIn: boolean;
  insufficientForCount?: number;
}

export const CreditModal: React.FC<CreditModalProps> = ({
  isOpen,
  onClose,
  uid,
  userCredits,
  onOpenAuth,
  isLoggedIn,
  insufficientForCount
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'packages' | 'promo' | 'history'>('overview');
  const [promoInput, setPromoInput] = useState('');
  const [isSubmittingPromo, setIsSubmittingPromo] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);
  const [bonusMessage, setBonusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Time remaining for daily bonus
  const [bonusStatus, setBonusStatus] = useState(() => canClaimDailyBonus(userCredits.lastDailyBonusClaim));

  useEffect(() => {
    const update = () => {
      setBonusStatus(canClaimDailyBonus(userCredits.lastDailyBonusClaim));
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [userCredits.lastDailyBonusClaim]);

  if (!isOpen) return null;

  const formatRemainingTime = (ms: number) => {
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleClaimBonus = async () => {
    if (!isLoggedIn) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    setIsClaimingBonus(true);
    setBonusMessage(null);
    try {
      const res = await claimDailyBonus(uid);
      if (res.success) {
        setBonusMessage({ type: 'success', text: res.message });
        setBonusStatus(canClaimDailyBonus(Date.now()));
      } else {
        setBonusMessage({ type: 'error', text: res.message });
      }
    } catch (e: any) {
      setBonusMessage({ type: 'error', text: e.message || 'Failed to claim daily bonus' });
    } finally {
      setIsClaimingBonus(false);
    }
  };

  const handleRedeemPromo = async (codeToUse?: string) => {
    const targetCode = (codeToUse || promoInput).trim();
    if (!targetCode) return;
    if (!isLoggedIn) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setIsSubmittingPromo(true);
    setPromoMessage(null);
    try {
      const res = await redeemPromoCode(uid, targetCode);
      if (res.success) {
        setPromoMessage({ type: 'success', text: res.message });
        setPromoInput('');
      } else {
        setPromoMessage({ type: 'error', text: res.message });
      }
    } catch (e: any) {
      setPromoMessage({ type: 'error', text: e.message || 'Failed to redeem code' });
    } finally {
      setIsSubmittingPromo(false);
    }
  };

  const handleAddDemoPack = async (amount: number, packName: string) => {
    if (!isLoggedIn) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    await addCredits(uid, amount, `Activated: ${packName} (+${amount} Credits)`);
    setPromoMessage({ type: 'success', text: `Successfully activated ${packName}! Added +${amount} credits.` });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        className="bg-[#ECEEF4] dark:bg-[#1A202E] border border-zinc-300 dark:border-white/10 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl space-y-5 text-left relative max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-300/80 dark:border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center font-bold text-xl shadow-xs">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-zinc-900 dark:text-zinc-50">
                  Melo Credit Management
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Live Balance
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                1 file metadata processing = 1 credit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Insufficient Credits Notice if triggered from processing */}
        {insufficientForCount !== undefined && insufficientForCount > userCredits.credits && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-500" />
            <div className="space-y-0.5">
              <p className="font-bold">Insufficient Credits</p>
              <p className="text-zinc-600 dark:text-zinc-300">
                You need {insufficientForCount} credits to process {insufficientForCount} files, but currently have {userCredits.credits} credits. Claim your daily bonus or redeem a promo code below to proceed!
              </p>
            </div>
          </div>
        )}

        {/* Credit Balance Card */}
        <div className="bg-white dark:bg-[#121620] border border-zinc-200/80 dark:border-white/5 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Current Available Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white font-display tracking-tight">
                {userCredits.credits}
              </span>
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                Credits
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
              <span>Credits Used: <strong className="text-zinc-700 dark:text-zinc-200">{userCredits.creditsUsed}</strong></span>
              <span>•</span>
              <span>Plan: <strong className="text-emerald-600 dark:text-emerald-400 uppercase">{userCredits.plan} Contributor</strong></span>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={handleClaimBonus}
              disabled={isClaimingBonus || (!bonusStatus.canClaim && isLoggedIn)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Gift size={14} />
              {isClaimingBonus
                ? 'Claiming...'
                : bonusStatus.canClaim || !isLoggedIn
                ? `Claim Daily +${DAILY_BONUS_AMOUNT} Bonus`
                : `Next Daily: ${formatRemainingTime(bonusStatus.timeRemainingMs)}`}
            </button>
            <span className="text-[10px] text-center text-zinc-400">
              Get +10 free credits every 24 hours
            </span>
          </div>
        </div>

        {/* Daily Bonus Feedback */}
        {bonusMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            bonusMessage.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
          }`}>
            {bonusMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{bonusMessage.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-white/10 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'overview'
                ? 'text-zinc-900 dark:text-white border-b-2 border-amber-500'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            Top-up & Redeem
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'packages'
                ? 'text-zinc-900 dark:text-white border-b-2 border-amber-500'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            Credit Packs
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === 'history'
                ? 'text-zinc-900 dark:text-white border-b-2 border-amber-500'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            Usage History ({userCredits.transactions?.length || 0})
          </button>
        </div>

        {/* Tab 1: Promo Code & Quick Claim */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Tag size={13} className="text-amber-500" /> Redeem Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code (e.g. MELO2026, WELCOME)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRedeemPromo();
                  }}
                  className="flex-1 bg-white dark:bg-[#121620] border border-zinc-300 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-900 dark:text-white uppercase placeholder:normal-case placeholder:font-sans placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                />
                <button
                  onClick={() => handleRedeemPromo()}
                  disabled={!promoInput.trim() || isSubmittingPromo}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-bold text-xs cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
                >
                  {isSubmittingPromo ? 'Applying...' : 'Apply Code'}
                </button>
              </div>
            </div>

            {/* Promo Result Message */}
            {promoMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                promoMessage.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
              }`}>
                {promoMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{promoMessage.text}</span>
              </div>
            )}

            {/* Available Promo Codes for Quick Click */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                Click to redeem instant creator grant codes:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(PROMO_CODES).map(([code, meta]) => {
                  const isClaimed = userCredits.claimedPromoCodes?.includes(code);
                  return (
                    <div
                      key={code}
                      onClick={() => {
                        if (!isClaimed) handleRedeemPromo(code);
                      }}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        isClaimed
                          ? 'bg-zinc-100 dark:bg-white/5 border-zinc-200 dark:border-white/5 opacity-60 cursor-default'
                          : 'bg-white dark:bg-[#121620] border-zinc-200 dark:border-white/10 hover:border-amber-500/50 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-zinc-900 dark:text-white">{code}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                            +{meta.credits}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate max-w-[170px]">{meta.label}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                        isClaimed 
                          ? 'text-zinc-400 bg-zinc-200/50 dark:bg-white/5' 
                          : 'text-amber-700 dark:text-amber-300 bg-amber-500/10'
                      }`}>
                        {isClaimed ? 'Claimed' : 'Redeem'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanatory rules */}
            <div className="bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-2xl p-3.5 text-[11px] space-y-1 text-zinc-600 dark:text-zinc-400">
              <p className="font-bold text-zinc-800 dark:text-zinc-200">How the Credit System Works:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Processing 1 photo or vector asset uses exactly 1 credit.</li>
                <li>New accounts receive 50 complimentary welcome credits upon registration.</li>
                <li>Claim +10 bonus credits free every single day.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Packages */}
        {activeTab === 'packages' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Select a Credit Package:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Starter Pack */}
              <div className="bg-white dark:bg-[#121620] border border-zinc-200 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Starter</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-display text-zinc-900 dark:text-white">100</span>
                    <span className="text-xs text-amber-500 font-bold">Credits</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">100 Files Metadata & Keywords</p>
                </div>
                <button
                  onClick={() => handleAddDemoPack(100, 'Starter Pack')}
                  className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  Activate +100
                </button>
              </div>

              {/* Creator Pro Pack */}
              <div className="bg-gradient-to-b from-amber-500/10 to-transparent bg-white dark:bg-[#121620] border-2 border-amber-500 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative shadow-md">
                <span className="absolute -top-2.5 right-3 bg-amber-500 text-zinc-950 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                  Popular
                </span>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Creator Pro</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-display text-zinc-900 dark:text-white">300</span>
                    <span className="text-xs text-amber-500 font-bold">Credits</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">Bulk Stock Submissions</p>
                </div>
                <button
                  onClick={() => handleAddDemoPack(300, 'Creator Pro Pack')}
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-xs"
                >
                  Activate +300
                </button>
              </div>

              {/* Studio Master Pack */}
              <div className="bg-white dark:bg-[#121620] border border-zinc-200 dark:border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Studio Master</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-display text-zinc-900 dark:text-white">1000</span>
                    <span className="text-xs text-amber-500 font-bold">Credits</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">Agencies & Power Users</p>
                </div>
                <button
                  onClick={() => handleAddDemoPack(1000, 'Studio Master Pack')}
                  className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                >
                  Activate +1000
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: History */}
        {activeTab === 'history' && (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {(!userCredits.transactions || userCredits.transactions.length === 0) ? (
              <div className="text-center py-8 text-zinc-400 text-xs">
                No transaction history recorded yet
              </div>
            ) : (
              userCredits.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 bg-white dark:bg-[#121620] border border-zinc-200/80 dark:border-white/5 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{tx.reason}</p>
                    <p className="text-[10px] text-zinc-400">
                      {new Date(tx.timestamp).toLocaleString()} • Balance: {tx.balanceAfter}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded-lg ${
                      tx.amount > 0
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-zinc-100 dark:bg-white/10 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>100% Secure & Real-time Synced</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-800 dark:text-white rounded-xl font-bold cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
