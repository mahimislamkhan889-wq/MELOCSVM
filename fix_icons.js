import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/className="text-white"/g, 'className="text-slate-900 dark:text-white"');

fs.writeFileSync('src/App.tsx', content);
