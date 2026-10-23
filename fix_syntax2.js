import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// I'll replace the line with `</div></div></main>`
content = content.replace(/<\/div><\/div><\/div><\/div><\/div><\/div><\/div><\/main>/, '</div></div></main>');
fs.writeFileSync('src/App.tsx', content);
