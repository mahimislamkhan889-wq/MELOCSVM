import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{!authLoading && \([\s\S]*?\}\)\}/;
content = content.replace(regex, '');

fs.writeFileSync('src/App.tsx', content);
