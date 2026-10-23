import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<\/AnimatePresence>\n<\/div>\n<\/div>\n<\/>/, '</AnimatePresence>\n</div>\n</>');
fs.writeFileSync('src/App.tsx', content);
