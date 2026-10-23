import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Strip all code related to `user` and `authLoading`
// Replaces them with static values or completely removes them
content = content.replace(/const \[user, setUser\].*?\n/g, '');
content = content.replace(/const \[authLoading, setAuthLoading\].*?\n/g, '');
content = content.replace(/const \[showProfileModal, setShowProfileModal\].*?\n/g, '');
content = content.replace(/const \[loginError, setLoginError\].*?\n/g, '');

// Strip Admin Panel imports and others
content = content.replace(/import AdminPanel.*?\n/g, '');
content = content.replace(/import \{.*?\} from '\.\/lib\/firebase';\n/g, '');

// Clean the header auth section. It looks like:
//            {!authLoading && (
//              user ? ( ... ) : ( ... )
//            )}
// We'll replace it with empty string
let authLoadingIndex = content.indexOf('{!authLoading && (');
if (authLoadingIndex !== -1) {
    let braceCount = 0;
    let authLoadingEndIndex = -1;
    for (let i = authLoadingIndex; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        else if (content[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
                authLoadingEndIndex = i + 1;
                break;
            }
        }
    }
    if (authLoadingEndIndex !== -1) {
        content = content.substring(0, authLoadingIndex) + content.substring(authLoadingEndIndex);
    }
}

// Remove Admin and Builder tabs
content = content.replace(/\{user\?\.role === 'admin' && \([\s\S]*?\}\)/g, '');
content = content.replace(/\{user\?\.role === 'builder' && \([\s\S]*?\}\)/g, '');

// Remove AdminPanel rendering block
content = content.replace(/\{user && \([\s\S]*?<AdminPanel[\s\S]*?\/>\s*\)\}/g, '');

// Now replace all other uses of 'user' with true or false as appropriate
content = content.replace(/if \(!user\) return;/g, '');
content = content.replace(/if \(!user\) \{/g, 'if (false) {');
content = content.replace(/if \(user\)/g, 'if (false)');
content = content.replace(/const isPendingAccess = user && \!user.hasAccess.*?;/g, 'const isPendingAccess = false;');
content = content.replace(/const showAuthModal = !user;/g, 'const showAuthModal = false;');
content = content.replace(/user\?\.role/g, "''");
content = content.replace(/user\?\.uid/g, "''");

// Any leftover useEffects using user
content = content.replace(/useEffect\(\(\) => \{\n\s*const checkAndReset[\s\S]*?\}, \[''\]\);\n/g, '');

// "user" in disabled checks
content = content.replace(/disabled=\{files\.length === 0 \|\| \(false && \!isPendingAccess && \!files\.some\(f => f\.status === 'pending' \|\| f\.status === 'error'\)\)\}/g, "disabled={files.length === 0}");

// Clean up remaining user references
content = content.replace(/user\./g, '({}).');

fs.writeFileSync('src/App.tsx', content);
console.log("App.tsx cleaned.");
