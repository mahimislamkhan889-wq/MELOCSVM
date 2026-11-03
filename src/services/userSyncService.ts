import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { resolveUserAvatar } from '../lib/avatarHelper';

export interface SyncedUserProfile {
  uid: string;
  displayName: string;
  name: string;
  email: string;
  gmail: string;
  photoURL: string;
  phoneNumber?: string;
  role: 'admin' | 'staff' | 'owner' | 'contributor';
  status: 'Active' | 'Non -login' | 'Unconfirmed';
  idNumber: string;
  credits: number;
  creditsUsed: number;
  plan: string;
  isAnonymous: boolean;
  providerId: string;
  lastLoginAt: any;
  lastActive: any;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Instantly collects and syncs user details (Gmail, name, photo, phone, role)
 * into Firestore at the exact moment of login.
 */
export async function syncUserOnLogin(authUser: any, overrideEmail?: string): Promise<SyncedUserProfile | null> {
  if (!authUser || authUser.isAnonymous) {
    return null;
  }

  const uid = authUser.uid;
  const userRef = doc(db, 'users', uid);

  // 1. Fetch existing record to preserve credits, role, and custom settings
  let existingDoc: any = null;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      existingDoc = snap.data();
    }
  } catch (err) {
    console.warn('userSyncService: Error fetching existing user doc:', err);
  }

  // 2. Extract authentic Email and Gmail from all available provider data or override
  const providerList = authUser.providerData || [];
  const providerEmailMatch = providerList.find((p: any) => p && p.email && p.email.includes('@'));
  const rawEmail = overrideEmail || 
    authUser.email || 
    providerEmailMatch?.email || 
    providerList[0]?.email || 
    (existingDoc?.email && existingDoc.email !== 'Authenticated User' && existingDoc.email.includes('@') ? existingDoc.email : '') || 
    authUser.phoneNumber || 
    existingDoc?.phoneNumber || 
    '';

  const cleanEmail = (rawEmail === 'Authenticated User' || rawEmail === 'guest') ? '' : rawEmail;
  const cleanGmail = cleanEmail.toLowerCase().endsWith('@gmail.com') ? cleanEmail : (existingDoc?.gmail || '');

  // 3. Extract authentic Display Name
  const providerNameMatch = providerList.find((p: any) => p && p.displayName && p.displayName.trim());
  const cleanName = authUser.displayName || 
    providerNameMatch?.displayName || 
    existingDoc?.displayName || 
    existingDoc?.name || 
    (cleanEmail && cleanEmail.includes('@') ? cleanEmail.split('@')[0] : (cleanEmail.startsWith('+') ? `Contributor (${cleanEmail.slice(-4)})` : 'Contributor'));

  // 4. Extract or Resolve authentic Avatar
  const providerPhotoMatch = providerList.find((p: any) => p && p.photoURL && p.photoURL.trim());
  const photoFromAuth = authUser.photoURL || providerPhotoMatch?.photoURL || existingDoc?.photoURL || existingDoc?.profilePic || null;
  const finalPhotoURL = photoFromAuth || resolveUserAvatar({
    displayName: cleanName,
    email: cleanEmail,
    id: uid
  });

  // 5. Extract Phone Number
  const providerPhoneMatch = providerList.find((p: any) => p && p.phoneNumber && p.phoneNumber.trim());
  const cleanPhone = authUser.phoneNumber || providerPhoneMatch?.phoneNumber || existingDoc?.phoneNumber || (cleanEmail.startsWith('+') ? cleanEmail : '');

  // 6. Resolve User Role (Preserve admin or staff if assigned)
  let cleanRole: 'admin' | 'staff' | 'owner' | 'contributor' = 'contributor';
  if (
    cleanEmail === 'mahimislamkhan889@gmail.com' || 
    cleanPhone === '+8801948481216' || 
    existingDoc?.role === 'admin'
  ) {
    cleanRole = 'admin';
  } else if (existingDoc?.role === 'staff' || existingDoc?.role === 'Staff User') {
    cleanRole = 'staff';
  } else if (existingDoc?.role === 'owner' || existingDoc?.role === 'Account Owner') {
    cleanRole = 'owner';
  } else {
    cleanRole = 'contributor';
  }

  // 7. Resolve ID Number & Credits
  const idNum = existingDoc?.idNumber || uid.slice(0, 5);
  const currentCredits = typeof existingDoc?.credits === 'number' ? existingDoc.credits : 50;
  const currentCreditsUsed = typeof existingDoc?.creditsUsed === 'number' ? existingDoc.creditsUsed : 0;
  const currentPlan = existingDoc?.plan || 'free';

  // 8. Assemble full profile payload
  const profilePayload: any = {
    uid,
    displayName: cleanName,
    name: cleanName,
    email: cleanEmail,
    gmail: cleanGmail,
    photoURL: finalPhotoURL,
    phoneNumber: cleanPhone,
    role: cleanRole,
    status: existingDoc?.status || 'Active',
    idNumber: idNum,
    credits: currentCredits,
    creditsUsed: currentCreditsUsed,
    plan: currentPlan,
    isAnonymous: false,
    providerId: authUser.providerData?.[0]?.providerId || 'firebase',
    lastLoginAt: serverTimestamp(),
    lastActive: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if (!existingDoc) {
    profilePayload.createdAt = serverTimestamp();
    profilePayload.claimedPromoCodes = [];
    profilePayload.transactions = [
      {
        id: 'init_' + Date.now(),
        amount: currentCredits,
        reason: 'Welcome Contributor Credits',
        timestamp: Date.now(),
        balanceAfter: currentCredits
      }
    ];
  }

  // 9. Persist immediately to Firestore
  try {
    await setDoc(userRef, profilePayload, { merge: true });
  } catch (err) {
    console.error('userSyncService: Error writing user profile to Firestore:', err);
  }

  return {
    ...profilePayload,
    lastLoginAt: Date.now(),
    lastActive: Date.now()
  };
}
