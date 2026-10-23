import fs from 'fs';
let content = fs.readFileSync('src/components/ApiConfigModal.tsx', 'utf8');

// replace slate with zinc
content = content.replace(/slate-/g, 'zinc-');
content = content.replace(/tranzinc-/g, 'translate-'); // in case it hit translate

// some dark colors that need fixes
content = content.replace(/bg-\[#2A2B33\]/g, 'bg-[#18181B]');
content = content.replace(/bg-\[#222329\]/g, 'bg-zinc-900/50');
content = content.replace(/bg-\[#31323B\]/g, 'bg-zinc-800');
content = content.replace(/bg-\[#3F404A\]/g, 'bg-white/10');
content = content.replace(/border-\[#21222A\]/g, 'border-white/5');
content = content.replace(/border-\[#4B4C56\]/g, 'border-white/10');
content = content.replace(/text-\[#A0A1AB\]/g, 'text-zinc-400');

fs.writeFileSync('src/components/ApiConfigModal.tsx', content);
