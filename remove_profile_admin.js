import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove AdminPanel import
content = content.replace(/import \{ AdminPanel \} from '\.\/components\/AdminPanel';\n/, '');

// Remove showProfileModal state
content = content.replace(/const \[showProfileModal, setShowProfileModal\] = useState\(false\);\n/, '');

// Remove Admin Tab button
content = content.replace(/\{user\?\.role === 'admin' && \([\s\S]*?<\/button>\n\s*\}\)/, '');

// Remove AdminPanel rendering block in main
content = content.replace(/\{tab === 'admin' && user\?\.role === 'admin' \? \(\n\s*<AdminPanel \/>\n\s*\) : \(/, '');
// Since we removed the opening ternary, we have to find the closing `)}` for this ternary.
// In the original code:
// {tab === 'admin' && user?.role === 'admin' ? (
//   <AdminPanel />
// ) : (
//   <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
// ...
//   </div>
// )}
// It ends right before `</main>`.
