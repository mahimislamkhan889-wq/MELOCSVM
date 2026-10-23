import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<\/div><\/>\)\}/g, "</>)}\n</div>");

fs.writeFileSync('src/App.tsx', content);
