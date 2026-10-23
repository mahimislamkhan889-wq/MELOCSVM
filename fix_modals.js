import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Profile Modal text
content = content.replace(/hover:text-white transition-colors/g, "hover:text-slate-900 dark:hover:text-white transition-colors");
content = content.replace(/bg-white\/10 rounded-full flex items-center justify-center text-white/g, "bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center text-slate-900 dark:text-white");
content = content.replace(/text-xl font-bold text-white mb-2/g, "text-xl font-bold text-slate-900 dark:text-white mb-2");
content = content.replace(/bg-white\/5 text-white\/70/g, "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/70");
content = content.replace(/text-sm text-slate-400 font-mono/g, "text-sm text-slate-500 dark:text-slate-400 font-mono");

// Auth Modal
content = content.replace(/text-xl font-bold text-white mb-2/g, "text-xl font-bold text-slate-900 dark:text-white mb-2"); // Might be redundant
content = content.replace(/bg-white\/10 rounded-full flex items-center justify-center text-white/g, "bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center text-slate-900 dark:text-white");

// Auth modal specific cases
content = content.replace(/border-white\/10/g, "border-slate-200 dark:border-white/10");
content = content.replace(/text-white \/>/g, "text-slate-900 dark:text-white />");

// More missing texts
content = content.replace(/text-white font-mono bg-slate-100/g, "text-slate-900 dark:text-white font-mono bg-slate-100");
content = content.replace(/text-white text-sm font-bold uppercase tracking-wider/g, "text-slate-900 dark:text-white text-sm font-bold uppercase tracking-wider");
content = content.replace(/bg-slate-100\/80 dark:bg-slate-800\/80 text-white/g, "bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-white");
content = content.replace(/hover:text-white hover:bg-white\/10/g, "hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10");

fs.writeFileSync('src/App.tsx', content);
