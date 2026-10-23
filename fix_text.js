import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// We have many "text-white" instances that should probably be "text-slate-900 dark:text-white"
// Let's replace only the ones that match our main headings and texts

content = content.replace(/text-white flex gap-1\.5 items-center/g, "text-slate-900 dark:text-white flex gap-1.5 items-center");
content = content.replace(/text-\[17px\] font-black text-white/g, "text-[17px] font-black text-slate-900 dark:text-white");
content = content.replace(/text-\[17px\] font-medium text-white/g, "text-[17px] font-medium text-slate-900 dark:text-white");
content = content.replace(/text-\[22px\] font-black text-white/g, "text-[22px] font-black text-slate-900 dark:text-white");
content = content.replace(/text-white text-xs mt-1 line-clamp-2/g, "text-slate-900 dark:text-white text-xs mt-1 line-clamp-2");
content = content.replace(/text-white text-sm font-medium group-hover/g, "text-slate-900 dark:text-white text-sm font-medium group-hover");
content = content.replace(/bg-white\/5 border border-white\/10 text-white/g, "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white");
content = content.replace(/bg-white\/10 flex items-center justify-center text-white/g, "bg-slate-200 dark:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white");
content = content.replace(/bg-white\/5 flex items-center justify-center text-white/g, "bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-900 dark:text-white");

fs.writeFileSync('src/App.tsx', content);
