import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/hover:text-black dark:hover:text-slate-900 dark:hover:text-white/g, "hover:text-slate-900 dark:hover:text-white");
content = content.replace(/bg-black\/5 dark:bg-white\/5 dark:bg-white\/10/g, "bg-slate-200 dark:bg-white/10");
content = content.replace(/bg-black\/10 dark:bg-white\/10 dark:bg-slate-900\/20 dark:bg-white\/20/g, "bg-slate-200 dark:bg-white/20");

// Check the Dropzone spacing, add some more vertical padding to it when empty
content = content.replace(/"relative group transition-all duration-500 active:scale-\[0\.99\] cursor-pointer",\n                  files.length > 0 \? "mb-6" : "h-72"/, '"relative group transition-all duration-500 active:scale-[0.99] cursor-pointer",\n                  files.length > 0 ? "mb-6" : "min-h-[24rem]"');

fs.writeFileSync('src/App.tsx', content);
