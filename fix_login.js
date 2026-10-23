import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Import signInAnonymously
content = content.replace(/signInWithPhoneNumber/, 'signInAnonymously');

// 2. Rewrite handleSendOtp
const sendOtpRegex = /const handleSendOtp = async \(e: React\.FormEvent\) => \{[\s\S]*?const handleVerifyOtp = async \(e: React\.FormEvent\) => \{/;

const newSendOtp = `const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.trim()) {
      setLoginError('Please enter your phone number.');
      return;
    }
    if (!loginName.trim()) {
      setLoginError('Please enter your name.');
      return;
    }
    try {
      setLoginError('');
      setAuthLoading(true);
      const result = await signInAnonymously(auth);
      const user = result.user;
      
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          phoneNumber: loginPhone,
          name: loginName,
          profilePic: profilePicUrl,
          role: 'pending',
          hasAccess: false,
          createdAt: serverTimestamp()
        });
      }
      setShowAuthModal(false);
    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || 'Failed to submit request');
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {`;

content = content.replace(sendOtpRegex, newSendOtp);

// 3. Update the login form condition so it only ever shows the 'phone' step (no OTP step).
// Wait, we can just leave loginStep alone, since it never gets set to 'otp' now!

fs.writeFileSync('src/App.tsx', content);
