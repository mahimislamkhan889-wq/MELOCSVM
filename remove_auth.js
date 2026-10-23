import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove auth imports
content = content.replace(/import \{ auth, db \} from '\.\/lib\/firebase';\n/, "import { db } from './lib/firebase';\n");
content = content.replace(/import \{ signOut, GoogleAuthProvider, signInWithPopup \} from 'firebase\/auth';\n/, '');

// 2. Remove states
content = content.replace(/const \[user, setUser\] = useState<UserProfile \| null>\(null\);\n\s*/, '');
content = content.replace(/const \[authLoading, setAuthLoading\] = useState\(true\);\n\s*/, '');
content = content.replace(/const \[showAuthModal, setShowAuthModal\] = useState\(false\);\n\s*/, '');
content = content.replace(/const \[loginPhone, setLoginPhone\] = useState\(''\);\n\s*/, '');
content = content.replace(/const \[loginName, setLoginName\] = useState\(''\);\n\s*/, '');
content = content.replace(/const \[loginOtp, setLoginOtp\] = useState\(''\);\n\s*/, '');
content = content.replace(/const \[loginStep, setLoginStep\] = useState<'phone' \| 'otp'>\('phone'\);\n\s*/, '');
content = content.replace(/const \[loginError, setLoginError\] = useState\(''\);\n\s*/, '');
content = content.replace(/const \[confirmationResult, setConfirmationResult\] = useState<any>\(null\);\n\s*/, '');

// 3. Remove user auth listener useEffect
// It usually looks like:
/*
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      ...
    });
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);
*/
// It's easier to just find the block by knowing its start and end roughly.
// Actually, I can use Regex or just string manipulation.
