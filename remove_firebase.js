import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove firebase imports
content = content.replace(/import \{ onAuthStateChanged \} from 'firebase\/auth';\n/g, '');
content = content.replace(/import \{ onSnapshot \} from 'firebase\/firestore';\n/g, '');
content = content.replace(/import \{ auth, .* \} from '\.\/lib\/firebase';\n/g, '');
content = content.replace(/import \{ ConfirmationResult \} from 'firebase\/auth';\n/g, '');

// Remove components that might rely on db
content = content.replace(/import AdminPanel from '\.\/components\/AdminPanel';\n/g, '');

// Replace user state with just a simple setup or remove entirely
content = content.replace(/const \[user, setUser\] = useState<UserProfile \| null>\(null\);\n/g, '');
content = content.replace(/const \[authLoading, setAuthLoading\] = useState\(true\);\n/g, '');
content = content.replace(/const \[showProfileModal, setShowProfileModal\] = useState\(false\);\n/g, '');
content = content.replace(/const \[loginError, setLoginError\] = useState<string \| null>\(null\);\n/g, '');

// Remove useEffects related to auth and firebase
const authEffectRegex = /useEffect\(\(\) => \{\n\s*const unsubscribeAuth = onAuthStateChanged[\s\S]*?\}, \[\]\);\n\n/g;
content = content.replace(authEffectRegex, '');

// Remove update user limits effect
const resetEffectRegex = /useEffect\(\(\) => \{\n\s*const checkAndResetDailyLimits = async \(\) => \{[\s\S]*?\}, \[user\?\.uid\]\);\n\n/g;
content = content.replace(resetEffectRegex, '');

// Clean up generate functions (remove user checks and increments)
content = content.replace(/if \(\!user\) \{\n\s*alert\('Please sign in to process files\.'\);\n\s*return;\n\s*\}/g, '');
content = content.replace(/if \(\!user\.hasAccess && user\.role \!\=\= 'admin' && user\.role \!\=\= 'builder'\) \{\n\s*alert\('You do not have access to use this app\.'\);\n\s*return;\n\s*\}/g, '');
content = content.replace(/if \(user\.role \!\=\= 'admin' && \!user\.isUnlimited && \(user\.dailyFilesGenerated \|\| 0\) >= \(user\.workLimit \?\? 50\)\) \{\n\s*alert\([\s\S]*?\);\n\s*return;\n\s*\}/g, '');
content = content.replace(/if \(user\) \{\n\s*await incrementUserFileCount\(user\.uid\);\n\s*\}/g, '');

// Handle login functions
const handleLoginRegex = /const handleLogin = async \(\) => \{[\s\S]*?setAuthLoading\(false\);\n\s*\};\n/g;
content = content.replace(handleLoginRegex, '');

const handleLogoutRegex = /const handleLogout = async \(\) => \{[\s\S]*?\}\n/g;
content = content.replace(handleLogoutRegex, '');

// In return block, remove auth specific conditions
content = content.replace(/if \(authLoading\) \{\n\s*return \([\s\S]*?\}\n/g, '');

content = content.replace(/const showAuthModal = \!user;/g, 'const showAuthModal = false;');
content = content.replace(/const isPendingAccess = user && \!user\.hasAccess && user\.role \!\=\= 'admin' && user\.role \!\=\= 'builder';/g, 'const isPendingAccess = false;');

fs.writeFileSync('src/App.tsx', content);
console.log("Firebase partially removed from App.tsx");
