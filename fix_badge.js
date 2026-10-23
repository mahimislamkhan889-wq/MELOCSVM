import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<h2 className="text-xl font-black text-black dark:text-white tracking-tight flex items-center gap-3">/, '<h2 className="text-[22px] font-black text-white tracking-tight flex items-center gap-3">');
content = content.replace(/<span className="bg-slate-100 dark:bg-white\/5 text-black dark:text-white text-\[10px\] px-2 py-1 rounded-full border border-slate-200 dark:border-white\/5 backdrop-blur-xl tabular-nums shadow-sm">/, '<span className="bg-[#424450] text-white text-[10px] px-2 py-1 rounded-full border-none font-bold tabular-nums">');

// Make the blank empty state perfectly match:
content = content.replace(/<div className="text-center py-12 text-slate-500 dark:text-slate-400 border border-t-0 border-slate-200 dark:border-white\/5 rounded-b-2xl bg-\[\#2A2B33\]">/, '<div className="text-center py-20 text-[#A0A1AB] font-medium border-none rounded-2xl bg-[#393A45]">');

fs.writeFileSync('src/App.tsx', content);
