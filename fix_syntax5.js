import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the messed up line:
content = content.replace(/<\/div><\/div><\/div><\/div><\/div><\/div><\/div><\/div><\/main>/, '</div></div></div></div></div></div></main></div>');

fs.writeFileSync('src/App.tsx', content);
