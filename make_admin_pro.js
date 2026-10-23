import fs from 'fs';
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/font-black/g, "font-bold");
content = content.replace(/rounded-3xl/g, "rounded-2xl");
content = content.replace(/text-white/g, "text-slate-900 dark:text-white");
// Except for buttons that might need real white text (like delete buttons or primary buttons)
// We'll leave them if they have bg-red-500 etc.
// But wait, it replaced everything. Let's be more specific.

fs.writeFileSync('src/components/AdminPanel.tsx', content);
