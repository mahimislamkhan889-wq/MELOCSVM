import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add imports at top
const importsToAdd = `
import { AdminPanel } from './components/AdminPanel';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  phoneNumber?: string;
  name?: string;
  role: 'admin' | 'builder' | 'pending';
  hasAccess: boolean;
  createdAt: any;
}
`;

content = content.replace("import { ApiConfigModal } from './components/ApiConfigModal';", importsToAdd + "\nimport { ApiConfigModal } from './components/ApiConfigModal';");

// 2. Add state variables inside App()
const stateToAdd = `
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginStep, setLoginStep] = useState<'phone' | 'otp'>('phone');
  const [loginError, setLoginError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      if (u) {
        // user is logged in via phone
        const userRef = doc(db, 'users', u.uid);
        unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setUser(snapshot.data() as UserProfile);
          } else {
            // Document doesn't exist, this might happen immediately after sign-in before we setDoc
            // We handle this inside handleVerifyOtp
          }
          setAuthLoading(false);
        });
      } else {
        setUser(null);
        setAuthLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.startsWith('+')) {
      setLoginError('Phone number must start with + and country code (e.g. +8801...)');
      return;
    }
    if (!loginName.trim()) {
      setLoginError('Please enter your name.');
      return;
    }
    try {
      setLoginError('');
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      }
      const confirmation = await signInWithPhoneNumber(auth, loginPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setLoginStep('otp');
    } catch (err: any) {
      console.error(err);
      setLoginError(err.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoginError('');
      const result = await confirmationResult.confirm(loginOtp);
      const user = result.user;
      
      // Check if user doc exists, if not create it
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          name: loginName,
          role: 'pending',
          hasAccess: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (err: any) {
      console.error(err);
      setLoginError('Invalid OTP. Try again.');
    }
  };

  const isPendingAccess = user && !user.hasAccess;
  const showAuthModal = !authLoading && !user;
`;

// Insert after   const [tab, setTab] = useState<TabType>('metadata');
content = content.replace("  const [tab, setTab] = useState<TabType>('metadata');", "  const [tab, setTab] = useState<TabType>('metadata');\n" + stateToAdd);

// Add window.recaptchaVerifier type if needed
content = content.replace(/export default function App\(\) \{/, 'declare global {\n  interface Window {\n    recaptchaVerifier: any;\n  }\n}\n\nexport default function App() {');


fs.writeFileSync('src/App.tsx', content);
console.log("Added auth logic");
