import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<div className="bg-slate-100 dark:bg-white\/5 border border-slate-200 dark:border-white\/10 p-5 rounded-3xl shadow-sm group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-500 mb-6 flex items-center justify-center w-20 h-20">/, '<div className="bg-[#40414F] border-none p-5 rounded-3xl shadow-sm group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-500 mb-6 flex items-center justify-center w-20 h-20">');

fs.writeFileSync('src/App.tsx', content);
