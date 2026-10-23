import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  // Backgrounds & Wrappers
  ['bg-slate-50 dark:bg-[#383944]', 'bg-[#FAFAFA] dark:bg-[#09090B]'],
  ['bg-white dark:bg-[#2A2B33]', 'bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-2xl'],
  ['border-slate-200 dark:border-[#21222A]', 'border-zinc-200 dark:border-white/5'],
  
  // Tab Switcher
  ['bg-slate-100 dark:bg-[#222329]', 'bg-zinc-100 dark:bg-white/5'],
  ['border-slate-200 dark:border-[#1A1A1E]', 'border-zinc-200 dark:border-white/5'],
  ['dark:bg-[#3F404A]', 'dark:bg-white/10'],
  ['text-slate-500 dark:text-[#A0A1AB]', 'text-zinc-500 dark:text-zinc-400'],
  ['rounded-lg', 'rounded-full'], // Generic, but will refine for specific cases if needed

  // Settings Panel
  ['bg-white dark:bg-[#31323B]', 'bg-white dark:bg-[#18181B]'],
  ['border-slate-200 dark:border-none', 'border-zinc-200 dark:border-white/5'],
  ['rounded-2xl p-6 shadow-sm', 'rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-white/5'],

  // Input & Sliders
  ['bg-slate-100 dark:bg-[#40414F]', 'bg-zinc-100 dark:bg-white/10'],
  ['bg-slate-200 dark:bg-[#202126]', 'bg-zinc-200 dark:bg-black/50'],

  // Upload Area
  ['bg-white dark:bg-[#2A2B33]', 'bg-white dark:bg-[#18181B]'],
  ['border-slate-300 dark:border-[#4B4C56]', 'border-zinc-200 dark:border-white/10'],
  ['hover:border-slate-400 dark:hover:border-[#6E7182]', 'hover:border-zinc-300 dark:hover:border-white/20'],
  ['hover:bg-slate-50 dark:hover:bg-[#383944]', 'hover:bg-zinc-50/50 dark:hover:bg-white/5'],
  ['bg-slate-200 dark:bg-[#4A4B56]', 'bg-zinc-100 dark:bg-white/5'],

  // Buttons
  ['bg-black dark:bg-[#6E7182]', 'bg-black dark:bg-white text-white dark:text-black'],
  ['dark:disabled:bg-[#6E7182]/50', 'dark:disabled:bg-white/20 dark:disabled:text-white/40'],
  ['bg-black dark:bg-[#31323B] text-white dark:text-white', 'bg-black dark:bg-white text-white dark:text-black'],

  // File Cards
  ['bg-slate-100/30 dark:bg-slate-900/30 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row group hover:border-slate-300 dark:border-white/20 transition-all duration-500 shadow-xl', 
   'bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden flex flex-col md:flex-row group hover:border-zinc-300 dark:hover:border-white/10 hover:shadow-2xl transition-all duration-500 shadow-sm'],
  
  // File Preview column in cards
  ['bg-slate-50 dark:bg-[#3F404A] flex flex-col flex-shrink-0 relative border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5',
   'bg-zinc-50 dark:bg-[#121214] flex flex-col flex-shrink-0 relative border-b md:border-b-0 md:border-r border-zinc-200 dark:border-white/5'],

  // General Text
  ['text-slate-900 dark:text-white', 'text-zinc-900 dark:text-zinc-50'],
  ['text-slate-500 dark:text-slate-400', 'text-zinc-500 dark:text-zinc-400'],
  ['border-slate-200 dark:border-white/10', 'border-zinc-200 dark:border-white/5'],
  ['border-slate-200 dark:border-white/5', 'border-zinc-200 dark:border-white/5'],
  ['bg-slate-200 dark:bg-white/5', 'bg-zinc-200 dark:bg-white/5'],
  ['bg-slate-100/70 dark:bg-slate-900/70', 'bg-white/80 dark:bg-[#09090B]/80'],
  
  // Clean gradients and weird tags
  ['bg-gradient-to-r from-black/10 dark:from-white/10 to-transparent', 'bg-transparent'],
];

for (const [search, replace] of replacements) {
  content = content.split(search).join(replace);
}

// Ensure the main outer div starts right
content = content.replace(/className="min-h-screen bg-\[\#FAFAFA\] dark:bg-\[\#09090B\] text-zinc-900 dark:text-zinc-50 font-sans selection:bg-white\/30 relative overflow-hidden"/, 'className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-50 font-sans selection:bg-black/10 dark:selection:bg-white/30 relative overflow-hidden"');

// Restore some rounded-lg that shouldn't be full
// Actually we globally replaced rounded-lg with rounded-full. That might break things. Let's fix specific ones.
// I will just use regex to change it back for specific buttons.
content = content.replace(/rounded-full font-bold text-xs/g, 'rounded-xl font-bold text-xs');
content = content.replace(/p-2 bg-white\/5 rounded-full/g, 'p-2 bg-white/5 rounded-xl');
content = content.replace(/rounded-full px-2 py-0.5/g, 'rounded-md px-2 py-0.5');

fs.writeFileSync('src/App.tsx', content);
console.log('UI Refactored');
