import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/border-\[\#006994\]\/30/g, "border-blue-500/30");
content = content.replace(/border-t-\[\#006994\]/g, "border-t-blue-500");
fs.writeFileSync('src/App.tsx', content);
