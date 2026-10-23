import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<\/form>\s*<div className="relative mt-6">[\s\S]*?<\/button>\s*<\/div>\s*\) : \(/m;
if (content.match(regex)) {
  content = content.replace(regex, "</form>\n                ) : (");
}

fs.writeFileSync('src/App.tsx', content);
