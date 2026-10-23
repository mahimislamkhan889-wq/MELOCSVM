import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove AdminPanel import
content = content.replace(/import \{ AdminPanel \} from '\.\/components\/AdminPanel';\n/g, '');

// 2. Remove Admin tab state (tab === 'admin')
content = content.replace(/\{user\?\.role === 'admin' && \([\s\S]*?<ShieldCheck size=\{16\}\/> Admin\n\s*<\/button>\n\s*\}\)/, '');

// 3. Replace Profile button with Logout button in Header
content = content.replace(/<button\n\s*onClick=\{\(\) => setShowProfileModal\(true\)\}\n\s*className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white\/10 flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white\/20 transition-colors border border-slate-300 dark:border-white\/10 overflow-hidden"\n\s*>\n\s*\{user\.profilePic \? \(\n\s*<img src=\{user\.profilePic\} alt="Profile" className="w-full h-full object-cover" \/>\n\s*\) : \(\n\s*<User size=\{14\} \/>\n\s*\)\}\n\s*<\/button>/g, `<button
                  onClick={() => {
                    if (confirm('Are you sure you want to sign out?')) {
                      localStorage.removeItem('melo_user_phone');
                      auth.signOut().then(() => window.location.reload());
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20 overflow-hidden"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>`);

// 4. Remove Profile Modal completely
// It starts with `{showProfileModal && user && (` and ends with `</AnimatePresence>` for the profile modal
// Let's find exactly the Profile Modal block
const profileModalStart = content.indexOf('{showProfileModal && user && (');
if (profileModalStart !== -1) {
    const profileModalEnd = content.indexOf('</AnimatePresence>', profileModalStart);
    if (profileModalEnd !== -1) {
        // Also remove the <AnimatePresence> tag that wraps it if it's there
        const beforeModal = content.lastIndexOf('<AnimatePresence>', profileModalStart);
        content = content.slice(0, beforeModal) + content.slice(profileModalEnd + '</AnimatePresence>'.length);
    }
}

// 5. Remove `showProfileModal` state
content = content.replace(/const \[showProfileModal, setShowProfileModal\] = useState\(false\);\n/, '');

// 6. Remove AdminPanel rendering block
// Find `{tab === 'admin' && user?.role === 'admin' ? (`
const adminRenderStart = content.indexOf("{tab === 'admin' && user?.role === 'admin' ? (");
if (adminRenderStart !== -1) {
    const adminRenderEnd = content.indexOf(") : (", adminRenderStart);
    if (adminRenderEnd !== -1) {
        content = content.slice(0, adminRenderStart) + content.slice(adminRenderEnd + ") : (".length);
        
        // Also we need to remove the closing `)}` before `</main>`
        // Let's find the closing `)}` that matches it.
        const mainEnd = content.indexOf('</main>');
        const closingBrace = content.lastIndexOf(')}', mainEnd);
        content = content.slice(0, closingBrace) + content.slice(closingBrace + 2);
    }
}

// 7. Remove any "Pending access" overlay or checks if any?
// Actually if they don't have an admin panel, maybe we should remove the 'hasAccess' requirement to process?
// The user asks to remove admin panel and profile. That means everyone who logs in can use the app without admin approval.
// Let's change the pending logic.
content = content.replace(/if \(!user\.hasAccess\) \{\n\s*alert\('Your account is pending approval\. Please wait for an admin to grant access\.'\);\n\s*return;\n\s*\}/g, '');

fs.writeFileSync('src/App.tsx', content);
