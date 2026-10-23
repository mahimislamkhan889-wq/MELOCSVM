import fs from 'fs';

const files = ['src/components/ApiConfigModal.tsx', 'src/components/AdminPanel.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  const replacements = [
    { regex: /(?<!dark:)\btext-white\b/g, replacement: 'text-slate-900 dark:text-white' },
    { regex: /(?<!dark:)\bbg-slate-950\b/g, replacement: 'bg-slate-50 dark:bg-slate-950' },
    { regex: /(?<!dark:)\bbg-slate-900\b/g, replacement: 'bg-white dark:bg-slate-900' },
    { regex: /(?<!dark:)\bborder-white\/10\b/g, replacement: 'border-slate-200 dark:border-white/10' },
    { regex: /(?<!dark:)\bborder-white\/5\b/g, replacement: 'border-slate-200 dark:border-white/5' },
    { regex: /(?<!dark:)\bbg-white\/5\b/g, replacement: 'bg-slate-100 dark:bg-white/5' },
    { regex: /(?<!dark:)\btext-slate-400\b/g, replacement: 'text-slate-500 dark:text-slate-400' },
    { regex: /(?<!dark:)\btext-slate-300\b/g, replacement: 'text-slate-600 dark:text-slate-300' },
    { regex: /(?<!dark:)\btext-slate-200\b/g, replacement: 'text-slate-800 dark:text-slate-200' },
    { regex: /(?<!dark:)\bbg-slate-800\b/g, replacement: 'bg-slate-100 dark:bg-slate-800' },
    { regex: /(?<!dark:)\bborder-white\/20\b/g, replacement: 'border-slate-300 dark:border-white/20' },
    { regex: /(?<!dark:)\bbg-slate-50(?:\/(\d+))? dark:bg-slate-950\/(\d+)\b/g, replacement: (match, p1, p2) => `bg-slate-50/${p2} dark:bg-slate-950/${p2}` },
    { regex: /(?<!dark:)\bbg-white(?:\/(\d+))? dark:bg-slate-900\/(\d+)\b/g, replacement: (match, p1, p2) => `bg-white/${p2} dark:bg-slate-900/${p2}` },
    { regex: /(?<!dark:)\bbg-slate-100(?:\/(\d+))? dark:bg-slate-800\/(\d+)\b/g, replacement: (match, p1, p2) => `bg-slate-100/${p2} dark:bg-slate-800/${p2}` },
  ];

  let newContent = content;

  if (!newContent.includes('dark:text-white')) {
    for (const { regex, replacement } of replacements) {
      newContent = newContent.replace(regex, replacement);
    }
    
    // Manual tweaks
    newContent = newContent.replace(/bg-\[\#11141d\]/g, 'bg-white dark:bg-[#11141d]');
    newContent = newContent.replace(/bg-\[\#111827\]/g, 'bg-slate-900 dark:bg-[#111827]');
    newContent = newContent.replace(/text-\[\#006994\]/g, 'text-cyan-700 dark:text-[#006994]');
    newContent = newContent.replace(/fill-\[\#006994\]/g, 'fill-cyan-700 dark:fill-[#006994]');
    newContent = newContent.replace(/bg-cyan-500\/10/g, 'bg-cyan-50 dark:bg-cyan-500/10');
    newContent = newContent.replace(/bg-cyan-500\/20/g, 'bg-cyan-100 dark:bg-cyan-500/20');
    newContent = newContent.replace(/text-slate-500(?!\sdark:)/g, 'text-slate-500 dark:text-slate-400');
    
    fs.writeFileSync(file, newContent);
    console.log(`Refactored ${file}`);
  }
}
