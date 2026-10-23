import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Refine background blobs
content = content.replace(
  /<div className="absolute top-\[-10%\] left-\[-10%\] w-\[500px\] h-\[500px\] bg-cyan-50 dark:bg-cyan-500\/10 rounded-full mix-blend-screen filter blur-\[120px\] animate-blob" \/>/g,
  '<div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-200/30 dark:bg-cyan-500/10 rounded-full dark:mix-blend-screen filter blur-[120px] animate-blob" />'
);
content = content.replace(
  /<div className="absolute bottom-\[10%\] right-\[-5%\] w-\[400px\] h-\[400px\] bg-purple-500\/10 rounded-full mix-blend-screen filter blur-\[100px\] animate-blob animation-delay-2000" \/>/g,
  '<div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-purple-300/30 dark:bg-purple-500/10 rounded-full dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />'
);
content = content.replace(
  /<div className="absolute top-\[20%\] right-\[10%\] w-\[300px\] h-\[300px\] bg-blue-500\/5 rounded-full mix-blend-screen filter blur-\[80px\] animate-blob animation-delay-4000" \/>/g,
  '<div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-blue-300/20 dark:bg-blue-500/5 rounded-full dark:mix-blend-screen filter blur-[80px] animate-blob animation-delay-4000" />'
);

// 2. Refine the theme toggle switch to be smaller and more professional
content = content.replace(
  /className="relative inline-flex items-center h-10 w-\[84px\] rounded-full bg-slate-200 dark:bg-\[\#111827\] border border-slate-300 dark:border-white\/5 transition-colors focus:outline-none shadow-inner"/g,
  'className="relative inline-flex items-center h-8 w-[64px] rounded-full bg-slate-200/70 dark:bg-slate-900 border border-slate-300 dark:border-white/10 transition-colors focus:outline-none shadow-inner overflow-hidden hover:bg-slate-200 dark:hover:bg-slate-800"'
);
content = content.replace(
  /<Sun size={16} className="text-slate-400 dark:text-slate-500" \/>/g,
  '<Sun size={14} className="text-slate-500 dark:text-slate-500" />'
);
content = content.replace(
  /<Moon size={16} className="text-slate-400 dark:text-slate-500" \/>/g,
  '<Moon size={14} className="text-slate-500 dark:text-slate-500" />'
);
content = content.replace(
  /"absolute left-1 w-8 h-8 rounded-full transition-transform duration-300 flex items-center justify-center",\n\s+"bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white\/10 z-10",\n\s+theme === 'dark' \? "translate-x-\[44px\]" : "translate-x-0"/g,
  `"absolute left-1 w-6 h-6 rounded-full transition-transform duration-300 flex items-center justify-center",\n                  "bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 z-10",\n                  theme === 'dark' ? "translate-x-[32px]" : "translate-x-0"`
);
content = content.replace(
  /<Moon size={16} className="text-white" \/> : <Sun size={16} className="text-slate-900" \/>/g,
  '<Moon size={14} className="text-white" /> : <Sun size={14} className="text-slate-900" />'
);
content = content.replace(
  /px-3/g,
  'px-2' // For the track icons inner spacing
);

fs.writeFileSync('src/App.tsx', content);
console.log("Refined theme");
