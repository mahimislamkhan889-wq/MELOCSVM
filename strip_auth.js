import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Imports
content = content.replace(/import \{ auth, db \} from '\.\/lib\/firebase';\n/, "import { db } from './lib/firebase';\n");
content = content.replace(/import \{ signOut, GoogleAuthProvider, signInWithPopup \} from 'firebase\/auth';\n/, '');

// Types
content = content.replace(/interface UserProfile \{[\s\S]*?\}\n/, '');

// States
const statesToRemove = [
  "const [user, setUser] = useState<UserProfile | null>(null);\n",
  "const [authLoading, setAuthLoading] = useState(true);\n",
  "const [showAuthModal, setShowAuthModal] = useState(false);\n",
  "const [loginPhone, setLoginPhone] = useState('');\n",
  "const [loginName, setLoginName] = useState('');\n",
  "const [profilePicUrl, setProfilePicUrl] = useState('');\n",
  "const [loginOtp, setLoginOtp] = useState('');\n",
  "const [loginStep, setLoginStep] = useState<'phone' | 'otp'>('phone');\n",
  "const [loginError, setLoginError] = useState('');\n",
  "const [confirmationResult, setConfirmationResult] = useState<any>(null);\n"
];

for (const state of statesToRemove) {
  content = content.replace(state, '');
  content = content.replace(state.trim() + '\n', ''); // in case of spacing issues
}

// Just safely remove all auth-related code using regex
content = content.replace(/useEffect\(\(\) => \{\n\s*let unsubscribeProfile[\s\S]*?\}, \[\]\);\n/, '');
content = content.replace(/const handleAdminLogin[\s\S]*?^\s*};\n/m, '');
// Since we have multiple handle* functions, let's just do it manually.

fs.writeFileSync('src/App.tsx', content);
