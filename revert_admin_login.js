import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove handleAdminLogin
const handleAdminLoginRegex = /const handleAdminLogin = async \(\) => \{[\s\S]*?const handleSendOtp/m;
content = content.replace(handleAdminLoginRegex, "const handleSendOtp");

// Remove Admin Login button and divider
const adminLoginBtnRegex = /<div className="relative mt-6">[\s\S]*?<\/button>\n              <\/div>\) : \(/m;
content = content.replace(adminLoginBtnRegex, "</div>) : (");

// Remove imports
content = content.replace(/import \{ signOut, GoogleAuthProvider, signInWithPopup \} from 'firebase\/auth';/, "import { signOut } from 'firebase/auth';");

fs.writeFileSync('src/App.tsx', content);
