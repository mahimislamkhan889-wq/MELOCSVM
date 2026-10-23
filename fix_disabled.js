import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// I previously simplified this:
// content = content.replace(/disabled=\{files.length === 0 \|\| \(user && !isPendingAccess && !files.some\(f => f.status === 'pending' \|\| f.status === 'error'\)\)\}/g, "disabled={files.length === 0}");
// Let's find "disabled={files.length === 0}" and replace with the proper user check

content = content.replace(/disabled=\{files\.length === 0\}/g, "disabled={files.length === 0 || isPendingAccess || !files.some(f => f.status === 'pending' || f.status === 'error')}");

// Also, inject `activeMode` recalculation to support 'admin' and 'builder' mapping to 'metadata'
content = content.replace(/const activeMode = tab as AppMode;/, "const activeMode = (tab === 'admin' || tab === 'builder') ? 'metadata' : tab as AppMode;");
if(!content.includes("const activeMode = (tab === 'admin' || tab === 'builder') ? 'metadata' : tab as AppMode;")) {
   content = content.replace(/const activeMode = tab;/g, "const activeMode = (tab === 'admin' || tab === 'builder') ? 'metadata' : tab as AppMode;");
}

fs.writeFileSync('src/App.tsx', content);
console.log("Fixed disabled state and activeMode");
