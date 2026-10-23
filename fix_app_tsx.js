import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix duplicates
content = content.replace(/rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-white\/5/g, 'rounded-3xl p-6 shadow-sm');
content = content.replace(/className="bg-white p-1\.5 rounded-full text-black shadow-md"/, 'className="bg-zinc-900 dark:bg-white p-1.5 rounded-xl text-white dark:text-zinc-900 shadow-md"');
content = content.replace(/<h1 className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-50 flex gap-1\.5 items-center">/g, '<h1 className="font-display font-bold text-xl tracking-tight text-zinc-900 dark:text-zinc-50 flex gap-1.5 items-center">');
content = content.replace(/flex bg-zinc-100 dark:bg-white\/5 p-1 rounded-xl/g, 'flex bg-zinc-100 dark:bg-white/5 p-1 rounded-full');
content = content.replace(/hover:text-slate-900 dark:hover:text-white/g, 'hover:text-zinc-900 dark:hover:text-zinc-50');

// Dropzone text
content = content.replace(/Drag & drop files here, or <span className="border-b border-slate-400 pb-0\.5">browse<\/span>/g, 'Drag & drop files here, or <span className="border-b border-zinc-400 dark:border-zinc-500 pb-0.5">browse</span>');

// Group headers
content = content.replace(/text-xs font-bold uppercase tracking-\[0\.2em\] text-black dark:text-white pl-3 border-l-2 border-black dark:border-white py-1 bg-transparent/g, 'text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-50 pl-3 border-l-2 border-zinc-900 dark:border-zinc-50 py-1');

// Small buttons in cards
content = content.replace(/bg-black dark:bg-white text-white dark:text-black rounded-xl/g, 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl');

// Toggles (like Custom Prompt, etc)
content = content.replace(/accent-black dark:accent-white/g, 'accent-zinc-900 dark:accent-zinc-100');

fs.writeFileSync('src/App.tsx', content);
