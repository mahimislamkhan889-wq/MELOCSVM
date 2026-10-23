import fs from 'fs';

const files = ['src/App.tsx', 'src/components/AdminPanel.tsx', 'src/components/ApiConfigModal.tsx'];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Any leftover cyan, rose, emerald etc classes
  content = content.replace(/border-t-cyan-500/g, 'border-t-black dark:border-t-white');
  content = content.replace(/border-t-cyan-400/g, 'border-t-black dark:border-t-white');
  content = content.replace(/shadow-cyan-500\/10/g, 'shadow-black/10 dark:shadow-white/10');
  content = content.replace(/accent-cyan-500/g, 'accent-black dark:accent-white');
  content = content.replace(/focus:border-cyan-500/g, 'focus:border-black dark:focus:border-white');
  content = content.replace(/border-cyan-500/g, 'border-black dark:border-white');
  content = content.replace(/from-cyan-500\/10/g, 'from-black/10 dark:from-white/10');
  content = content.replace(/fill-cyan-700/g, 'fill-black dark:fill-white');
  content = content.replace(/text-slate-600/g, 'text-neutral-600');
  content = content.replace(/bg-cyan-200\/30/g, 'bg-black/5 dark:bg-white/5');
  
  // Leftover hardcoded colors
  content = content.replace(/text-\[\#006994\]/g, 'text-black dark:text-white');
  content = content.replace(/fill-\[\#006994\]/g, 'fill-black dark:fill-white');
  content = content.replace(/dark:bg-slate-950/g, 'dark:bg-black');
  
  content = content.replace(/bg-black dark:bg-white p-1.5 rounded-lg text-slate-950/g, 'bg-black dark:bg-white p-1.5 rounded-lg text-white dark:text-black');
  
  // Specific fix for the messy string: dark:bg-black/10 dark:bg-white/10
  content = content.replace(/dark:bg-black\/10 dark:bg-white\/10/g, 'dark:bg-white/10');
  content = content.replace(/dark:fill-black dark:fill-white/g, 'dark:fill-white');

  fs.writeFileSync(file, content);
  console.log(`Wiped colors in ${file}`);
}
