import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix duplicated dark classes and specific missing ones
content = content.replace(/bg-white dark:bg-white dark:bg-\[\#2A2B33\]/g, "bg-white dark:bg-[#2A2B33]");
content = content.replace(/text-white dark:text-black dark:text-white dark:text-black/g, "text-white dark:text-black");

// Fix Theme Toggle Button (Needs slate-900 in light mode)
content = content.replace(/w-8 h-8 rounded-full bg-white\/5 flex items-center justify-center text-white hover:bg-white\/10 transition-colors border border-white\/10/g, "w-8 h-8 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/10 transition-colors border border-slate-300 dark:border-white/10");

// Fix Auth Login button in header
content = content.replace(/px-4 py-2 bg-white text-black rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity/g, "px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity");

// Fix user profile pic in header
content = content.replace(/w-8 h-8 rounded-full bg-white\/10 flex items-center justify-center text-white hover:bg-white\/20 transition-colors border border-white\/10 overflow-hidden/g, "w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-colors border border-slate-300 dark:border-white/10 overflow-hidden");

// Fix missing dark prefixes for text in Admin
content = content.replace(/<span className="px-2 bg-\[\#3F404A\] text-slate-400">Admin Only<\/span>/g, '<span className="px-2 bg-white dark:bg-[#3F404A] text-slate-500 dark:text-slate-400">Admin Only</span>');

fs.writeFileSync('src/App.tsx', content);
