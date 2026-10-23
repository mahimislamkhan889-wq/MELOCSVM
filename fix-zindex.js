import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  /<\/div>\s*<div className="flex items-center gap-4 relative">/,
  '</div>\n          <div className="flex items-center gap-4 relative z-10">'
);
fs.writeFileSync('src/App.tsx', content);
console.log("Fixed z-index");
