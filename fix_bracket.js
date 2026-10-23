import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/          \}\)\n      <\/main>/, '          </div>\n      </main>');

fs.writeFileSync('src/App.tsx', content);
console.log("Fixed main bracket");
