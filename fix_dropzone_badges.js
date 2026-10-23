import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the badges inside the dropzone to match the screenshot
// Current: px-4 py-2 bg-slate-500/40 text-black dark:text-white rounded-full text-sm font-bold tracking-wide shadow-sm backdrop-blur-md border border-slate-500/20
content = content.replace(/flex items-center gap-1\.5 px-4 py-2 bg-slate-500\/40 text-black dark:text-white rounded-full text-sm font-bold tracking-wide shadow-sm backdrop-blur-md border border-slate-500\/20/g, 'flex items-center gap-1.5 px-4 py-2 bg-[#4A4B56] text-white rounded-full text-sm font-bold tracking-wide shadow-sm');
// the image icon text is currently white due to <ImageIcon className="text-white" />
content = content.replace(/className="w-16 h-16 text-slate-400 dark:text-slate-500 mb-6"/g, 'className="w-16 h-16 text-[#A0A1AB] mb-6"');

// Fix dropzone container border
// border-[#1C1D22] hover:border-[#4B4C56] hover:bg-[#383944] p-12
content = content.replace(/border-\[\#1C1D22\] hover:border-\[\#4B4C56\] hover:bg-\[\#383944\] p-12/g, 'border-2 border-dashed border-[#4B4C56] hover:border-[#6E7182] hover:bg-[#383944] p-12');

fs.writeFileSync('src/App.tsx', content);
