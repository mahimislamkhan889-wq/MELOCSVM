import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/\{tab \!== 'admin' && \(\n/g, "{tab !== 'admin' && (<>\n");
content = content.replace(/<\/div>\n\)\}\n      <\/main>/g, "</div>\n</>)}\n      </main>");

fs.writeFileSync('src/App.tsx', content);
console.log("Fixed fragment wrap for tabs");
