import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/text-\[\#006994\]/g, "text-blue-500");
content = content.replace(/text-\[\#a1a1aa\]/g, "text-slate-500 dark:text-slate-400");
content = content.replace(/text-\[\#A0A1AB\]/g, "text-slate-500 dark:text-slate-400");

fs.writeFileSync('src/App.tsx', content);
