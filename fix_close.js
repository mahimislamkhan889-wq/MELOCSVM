import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<\/div>\s*<\/>\)\}\s*<\/main>/g, "</>)}\n</div>\n      </main>");

fs.writeFileSync('src/App.tsx', content);
