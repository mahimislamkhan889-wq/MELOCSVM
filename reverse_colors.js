import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/text-blue-500/g, "text-[#006994]");
content = content.replace(/border-blue-500\/30/g, "border-[#006994]/30");
content = content.replace(/border-t-blue-500/g, "border-t-[#006994]");
// Instead of blanket replacing slate-500, let's leave some texts as slate-500, but revert specific ones if needed.
// Actually, earlier the user liked the full dark aesthetic. But restoring everything manually is tricky.

fs.writeFileSync('src/App.tsx', content);
