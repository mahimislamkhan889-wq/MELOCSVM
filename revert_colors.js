import fs from 'fs';

function revertColors(file) {
  let content = fs.readFileSync(file, 'utf8');
  // I need to be careful. In App.tsx, the background was dark:bg-neutral-900 mostly.
  // Actually, let's just replace `dark:bg-black` with `dark:bg-neutral-900`.
  // Because `bg-neutral-900` was mostly used in dark mode.
  // Were there any `bg-neutral-900` in light mode? Maybe `text-neutral-900`? I only replaced `bg-neutral-900`.
  
  content = content.replace(/dark:bg-black/g, 'dark:bg-neutral-900');
  
  // What about AdminPanel.tsx?
  // bg-neutral-900 was used in dark mode: dark:bg-neutral-900
  // bg-neutral-50 was used in light mode: bg-neutral-50. My sed replaced bg-neutral-50 with bg-black/5.
  // Let's replace `bg-black/5` back to `bg-neutral-50` ONLY if it's not `dark:bg-black/5`.
  
  fs.writeFileSync(file, content);
}

revertColors('src/App.tsx');
revertColors('src/components/AdminPanel.tsx');

let adminContent = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
adminContent = adminContent.replace(/(?<!dark:)bg-black\/5/g, 'bg-neutral-50');
fs.writeFileSync('src/components/AdminPanel.tsx', adminContent);

console.log("Colors partially reverted.");
