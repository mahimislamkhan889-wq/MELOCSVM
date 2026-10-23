import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regexToRemove = /try \{\n\s*setLoginError[\s\S]*?const isPendingAccess = false;\n/m;
content = content.replace(regexToRemove, '');

// Wait, the first match was actually the middle of handleSendOtp since I only stripped the start of it by accident earlier!
// Let's just find `const [isDarkMode` and remove everything before it, up to `export default function App() {`
const startOfApp = content.indexOf('export default function App() {');
const endOfAppTop = content.indexOf('const [isDarkMode', startOfApp);
if (startOfApp !== -1 && endOfAppTop !== -1) {
  content = content.slice(0, startOfApp + 'export default function App() {\n'.length) + content.slice(endOfAppTop);
}

fs.writeFileSync('src/App.tsx', content);
