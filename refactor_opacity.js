import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  { regex: /(?<!dark:)\bbg-slate-50(?:\/(\d+))? dark:bg-slate-950\/(\d+)\b/g, replacement: (match, p1, p2) => `bg-slate-50/${p2} dark:bg-slate-950/${p2}` },
  { regex: /(?<!dark:)\bbg-white(?:\/(\d+))? dark:bg-slate-900\/(\d+)\b/g, replacement: (match, p1, p2) => `bg-white/${p2} dark:bg-slate-900/${p2}` },
  { regex: /(?<!dark:)\bbg-slate-100(?:\/(\d+))? dark:bg-slate-800\/(\d+)\b/g, replacement: (match, p1, p2) => `bg-slate-100/${p2} dark:bg-slate-800/${p2}` },
];

let newContent = content;
for (const { regex, replacement } of replacements) {
  newContent = newContent.replace(regex, replacement);
}

// Clean up some hardcoded dark colors
newContent = newContent.replace(/bg-\[\#11141d\]/g, 'bg-white dark:bg-[#11141d]');
newContent = newContent.replace(/bg-\[\#111827\]/g, 'bg-slate-900 dark:bg-[#111827]');
newContent = newContent.replace(/text-\[\#006994\]/g, 'text-cyan-700 dark:text-[#006994]');
newContent = newContent.replace(/fill-\[\#006994\]/g, 'fill-cyan-700 dark:fill-[#006994]');
newContent = newContent.replace(/bg-cyan-500\/10/g, 'bg-cyan-50 dark:bg-cyan-500/10');
newContent = newContent.replace(/bg-cyan-500\/20/g, 'bg-cyan-100 dark:bg-cyan-500/20');
newContent = newContent.replace(/text-slate-500(?!\sdark:)/g, 'text-slate-500 dark:text-slate-400'); // make light mode a bit darker

fs.writeFileSync('src/App.tsx', newContent);
console.log("Refactored Opacities");
