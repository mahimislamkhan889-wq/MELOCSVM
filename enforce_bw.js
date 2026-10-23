import fs from 'fs';

const files = ['src/App.tsx', 'src/components/AdminPanel.tsx', 'src/components/ApiConfigModal.tsx'];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Replace background colors (colored accents)
  content = content.replace(/bg-cyan-500\/10/g, 'bg-black/10 dark:bg-white/10');
  content = content.replace(/bg-cyan-500\/20/g, 'bg-black/20 dark:bg-white/20');
  content = content.replace(/bg-cyan-500/g, 'bg-black dark:bg-white');
  content = content.replace(/bg-cyan-100/g, 'bg-black/10 dark:bg-white/10');
  content = content.replace(/bg-cyan-50\b/g, 'bg-black/5 dark:bg-white/5');
  content = content.replace(/bg-cyan-400\/\d+/g, 'bg-black/10 dark:bg-white/10');
  
  content = content.replace(/bg-emerald-500\/20/g, 'bg-black/20 dark:bg-white/20');
  content = content.replace(/bg-rose-500\/10/g, 'bg-black/10 dark:bg-white/10');
  content = content.replace(/bg-rose-500/g, 'bg-black dark:bg-white');
  content = content.replace(/bg-amber-500\/10/g, 'bg-black/10 dark:bg-white/10');
  content = content.replace(/bg-amber-500\/20/g, 'bg-black/20 dark:bg-white/20');
  content = content.replace(/bg-purple-300\/30/g, 'bg-black/5 dark:bg-white/5');
  content = content.replace(/bg-purple-500\/10/g, 'bg-black/5 dark:bg-white/5');
  content = content.replace(/bg-blue-300\/20/g, 'bg-black/5 dark:bg-white/5');
  content = content.replace(/bg-blue-500\/5/g, 'bg-black/5 dark:bg-white/5');

  // Text color replacements
  content = content.replace(/text-cyan-300/g, 'text-black dark:text-white');
  content = content.replace(/text-cyan-400/g, 'text-black dark:text-white');
  content = content.replace(/text-cyan-500/g, 'text-black dark:text-white');
  content = content.replace(/text-cyan-700/g, 'text-white dark:text-black');
  content = content.replace(/text-emerald-400/g, 'text-black dark:text-white');
  content = content.replace(/text-rose-400/g, 'text-black dark:text-white');
  content = content.replace(/text-amber-500/g, 'text-black dark:text-white');
  content = content.replace(/text-\[\#54a0ff\]/g, 'text-black dark:text-white');
  content = content.replace(/text-\[\#006994\]/g, 'text-white dark:text-black');

  // Borders
  content = content.replace(/border-cyan-500\/20/g, 'border-black/20 dark:border-white/20');
  content = content.replace(/border-cyan-500\/30/g, 'border-black/30 dark:border-white/30');
  content = content.replace(/border-cyan-400\/20/g, 'border-black/20 dark:border-white/20');
  content = content.replace(/border-cyan-400\/40/g, 'border-black/40 dark:border-white/40');
  content = content.replace(/border-cyan-400/g, 'border-black dark:border-white');
  content = content.replace(/border-emerald-500\/30/g, 'border-black/30 dark:border-white/30');
  content = content.replace(/border-rose-500\/10/g, 'border-black/10 dark:border-white/10');
  content = content.replace(/border-amber-500\/20/g, 'border-black/20 dark:border-white/20');
  content = content.replace(/border-orange-500\/10/g, 'border-black/10 dark:border-white/10');
  content = content.replace(/border-rose-500\/30/g, 'border-black/30 dark:border-white/30');

  // Shadows
  content = content.replace(/shadow-\[0_0_15px_rgba\(6,182,212,0\.\d+\)\]/g, 'shadow-md');
  content = content.replace(/shadow-\[0_0_30px_rgba\(34,211,238,0\.\d+\)\]/g, 'shadow-md');
  content = content.replace(/shadow-\[0_20px_40px_-8px_rgba\(6,182,212,0\.\d+\)\]/g, 'shadow-lg');
  content = content.replace(/shadow-\[0_10px_20px_-8px_rgba\(6,182,212,0\.\d+\)\]/g, 'shadow-md');
  content = content.replace(/shadow-\[0_0_20px_rgba\(34,211,238,0\.\d+\)\]/g, 'shadow-sm');
  content = content.replace(/shadow-\[0_0_15px_rgba\(16,185,129,0\.\d+\)\]/g, 'shadow-sm');
  content = content.replace(/shadow-cyan-500\/20/g, 'shadow-black/20 dark:shadow-white/20');

  // Interactive states
  content = content.replace(/hover:bg-cyan-400/g, 'hover:bg-neutral-800 dark:hover:bg-neutral-200');
  content = content.replace(/hover:bg-cyan-500/g, 'hover:bg-black dark:hover:bg-white');
  content = content.replace(/hover:text-slate-950/g, 'hover:text-white dark:hover:text-black');
  
  // Specific bug icon bugfix from previous bg-cyan-500
  content = content.replace(/bg-black dark:bg-white p-1\.5 rounded-lg text-slate-950/g, 'bg-black dark:bg-white p-1.5 rounded-lg text-white dark:text-black');
  content = content.replace(/bg-black dark:bg-white text-slate-950 rounded-xl/g, 'bg-black dark:bg-white text-white dark:text-black rounded-xl');
  content = content.replace(/bg-black dark:bg-white text-slate-900 dark:text-white rounded-xl/g, 'bg-black dark:bg-white text-white dark:text-black rounded-xl');

  // Enforce stark black/white on main text
  content = content.replace(/text-slate-900 dark:text-white/g, 'text-black dark:text-white');
  content = content.replace(/text-slate-800 dark:text-slate-200/g, 'text-black dark:text-white');
  content = content.replace(/text-slate-600 dark:text-slate-300/g, 'text-neutral-700 dark:text-neutral-300');
  content = content.replace(/text-slate-500 dark:text-slate-400/g, 'text-neutral-500 dark:text-neutral-400');
  
  // Update slate backgrounds to neutral for a purer grayscale
  content = content.replace(/bg-slate-100/g, 'bg-neutral-100');
  content = content.replace(/bg-slate-50\/(\d+)/g, 'bg-white/$1');
  content = content.replace(/bg-slate-200\/(\d+)/g, 'bg-neutral-200/$1');
  content = content.replace(/bg-slate-900/g, 'bg-neutral-900');
  content = content.replace(/bg-slate-800/g, 'bg-neutral-800');
  content = content.replace(/bg-slate-700/g, 'bg-neutral-700');
  content = content.replace(/bg-\[\#020617\]/g, 'bg-black');
  content = content.replace(/bg-\[\#111827\]/g, 'bg-neutral-900');
  
  // Slate border mapping
  content = content.replace(/border-slate-200/g, 'border-neutral-200');
  content = content.replace(/border-slate-300/g, 'border-neutral-300');

  // Force button and icon text colors
  // "white mood e black text icon all, black mood e white text icon all"
  content = content.replace(/fill-\[\#006994\]/g, 'fill-black dark:fill-white');

  fs.writeFileSync(file, content);
  console.log(`Enforced Black & White on ${file}`);
}
