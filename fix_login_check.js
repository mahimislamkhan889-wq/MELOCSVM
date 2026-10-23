import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/if \(false\) \{\n\s*alert\("Please login first to process files\."\);\n\s*return;\n\s*\}/g, '');

fs.writeFileSync('src/App.tsx', content);
