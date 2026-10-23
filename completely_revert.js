import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove handleAdminLogin
const handleAdminLoginRegex = /const handleAdminLogin = async \(\) => \{[\s\S]*?const handleSendOtp/m;
content = content.replace(handleAdminLoginRegex, "const handleSendOtp");

// Remove Admin Login button and divider
// The button is between `</form>` and `) : (`
const adminLoginBtnRegex = /<\/form>\s*<div className="relative mt-6">[\s\S]*?<\/button>\s*<\/div>\) : \(/m;
if (content.match(adminLoginBtnRegex)) {
  content = content.replace(adminLoginBtnRegex, "</form>\n              ) : (");
}

// Check for the weird div wrapper we added around the form
content = content.replace(/{loginStep === 'phone' \? \(<div className="w-full">\n<form onSubmit=\{handleSendOtp\}/m, "{loginStep === 'phone' ? (<form onSubmit={handleSendOtp}");

// Remove imports
content = content.replace(/import \{ signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged \} from 'firebase\/auth';/, "import { signOut } from 'firebase/auth';");
content = content.replace(/import \{ signOut, GoogleAuthProvider, signInWithPopup \} from 'firebase\/auth';/, "import { signOut } from 'firebase/auth';");

fs.writeFileSync('src/App.tsx', content);
