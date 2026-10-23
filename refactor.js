import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

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
];

let newContent = content;

if (!newContent.includes('dark:text-white')) {
  for (const { regex, replacement } of replacements) {
    newContent = newContent.replace(regex, replacement);
  }
  fs.writeFileSync('src/App.tsx', newContent);
  console.log("Refactored App.tsx");
} else {
  console.log("Already refactored");
}
