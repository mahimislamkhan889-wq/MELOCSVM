import fs from 'fs';

function restoreFile(file) {
  let content = fs.readFileSync(file, 'utf8');

  // Convert neutral to slate
  content = content.replace(/neutral-900/g, 'slate-900');
  content = content.replace(/neutral-800/g, 'slate-800');
  content = content.replace(/neutral-700/g, 'slate-700');
  content = content.replace(/neutral-600/g, 'slate-600');
  content = content.replace(/neutral-500/g, 'slate-500');
  content = content.replace(/neutral-400/g, 'slate-400');
  content = content.replace(/neutral-300/g, 'slate-300');
  content = content.replace(/neutral-200/g, 'slate-200');
  content = content.replace(/neutral-100/g, 'slate-100');
  content = content.replace(/neutral-50/g, 'slate-50');

  // Any remaining black/white in dark mode that were too harsh:
  // Let's replace 'bg-black' with 'bg-slate-950' and 'bg-white' with 'bg-slate-50' where appropriate?
  // Wait, I previously changed things like bg-black/10, etc.
  
  fs.writeFileSync(file, content);
}

restoreFile('src/App.tsx');
restoreFile('src/components/AdminPanel.tsx');

console.log("Colors changed to slate.");
