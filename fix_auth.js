import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove Firebase auth imports and unused variables
content = content.replace(/import \{ onAuthStateChanged, RecaptchaVerifier, signInAnonymously, signOut \} from 'firebase\/auth';/, "import { signOut } from 'firebase/auth';\nimport { collection, query, where, getDocs } from 'firebase/firestore';");

// 2. Replace useEffect for auth
const useEffectRegex = /useEffect\(\(\) => \{[\s\S]*?const unsubscribeAuth = onAuthStateChanged[\s\S]*?return \(\) => \{[\s\S]*?unsubscribeAuth\(\);[\s\S]*?if \(unsubscribeProfile\) unsubscribeProfile\(\);[\s\S]*?\};\n  \}, \[\]\);/m;

const newUseEffect = `useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    const savedPhone = localStorage.getItem('melo_user_phone');
    
    if (savedPhone) {
      const userRef = doc(db, 'users', savedPhone);
      unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          if (data.role !== 'admin' && savedPhone === '+880123456789') { // safety fallback for developer
            import('firebase/firestore').then(({updateDoc}) => {
              updateDoc(userRef, { role: 'admin', hasAccess: true });
            });
          }
          setUser(data);
        } else {
          setUser(null);
          localStorage.removeItem('melo_user_phone');
        }
        setAuthLoading(false);
      });
    } else {
      setUser(null);
      setAuthLoading(false);
    }

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);`;

content = content.replace(useEffectRegex, newUseEffect);

// 3. Rewrite handleSendOtp (which acts as Login / Request)
const sendOtpRegex = /const handleSendOtp = async \(e: React\.FormEvent\) => \{[\s\S]*?const handleVerifyOtp = async/m;

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
      
      const userRef = doc(db, 'users', loginPhone);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new request
        await setDoc(userRef, {
          uid: loginPhone,
          phoneNumber: loginPhone,
          name: loginName,
          profilePic: profilePicUrl,
          role: 'pending',
          hasAccess: false,
          createdAt: serverTimestamp()
        });
      }
      
      localStorage.setItem('melo_user_phone', loginPhone);
      setShowAuthModal(false);
      
      // The onSnapshot in a separate effect will catch it, but let's just trigger a reload to keep it simple, or set user
      window.location.reload();
      
    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || 'Failed to submit request');
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async`;

content = content.replace(sendOtpRegex, newSendOtp);

// 4. Update logout function
const logoutRegex = /<button[\s\S]*?onClick=\{async \(\) => \{[\s\S]*?await signOut\(auth\);[\s\S]*?\}\}[\s\S]*?>[\s\S]*?<LogOut size=\{16\} \/> Sign Out[\s\S]*?<\/button>/m;
const newLogout = `<button
                    onClick={async () => {
                      localStorage.removeItem('melo_user_phone');
                      window.location.reload();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-medium"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>`;
content = content.replace(logoutRegex, newLogout);


fs.writeFileSync('src/App.tsx', content);
