import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/border-2 border-dashed border-\[\#4B4C56\]/g, 'border border-dashed border-[#4B4C56]');
fs.writeFileSync('src/App.tsx', content);
