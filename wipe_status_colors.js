import fs from 'fs';

const files = ['src/App.tsx', 'src/components/AdminPanel.tsx', 'src/components/ApiConfigModal.tsx'];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');

  // Strip emerald
  content = content.replace(/emerald-[a-z0-9\/]+/g, 'neutral-500');
  content = content.replace(/emerald/g, 'neutral');
  
  // Strip rose
  content = content.replace(/text-rose-500/g, 'text-black dark:text-white');
  content = content.replace(/text-rose-400/g, 'text-black dark:text-white');
  content = content.replace(/bg-rose-900\/40/g, 'bg-black/10 dark:bg-white/10');
  content = content.replace(/border-rose-[0-9]+\/20/g, 'border-black/20 dark:border-white/20');
  content = content.replace(/shadow-rose-[0-9]+\/[0-9]+/g, 'shadow-black/10 dark:shadow-white/10');

  // Strip amber
  content = content.replace(/border-amber-500\/30/g, 'border-black/30 dark:border-white/30');
  content = content.replace(/text-amber-400/g, 'text-black dark:text-white');
  
  // Strip purple
  content = content.replace(/border-purple-500\/30/g, 'border-black/30 dark:border-white/30');
  content = content.replace(/text-purple-400/g, 'text-black dark:text-white');
  
  // Strip orange
  content = content.replace(/text-orange-500/g, 'text-black dark:text-white');
  content = content.replace(/text-orange-400/g, 'text-black dark:text-white');
  content = content.replace(/bg-orange-[0-9]+\/[0-9]+/g, 'bg-black/10 dark:bg-white/10');

  // Any remaining generic replace
  content = content.replace(/bg-neutral-500/g, 'bg-black dark:bg-white');
  content = content.replace(/border-neutral-500/g, 'border-black dark:border-white');

  fs.writeFileSync(file, content);
  console.log(`Wiped status colors in ${file}`);
}
