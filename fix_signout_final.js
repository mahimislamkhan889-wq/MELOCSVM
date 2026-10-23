import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /localStorage\.removeItem\('melo_user_phone'\); auth\.signOut\(\)\.then\(\(\) => window\.location\.reload\(\)\);/,
  "localStorage.removeItem('melo_user_phone'); window.location.reload();"
);

fs.writeFileSync('src/App.tsx', content);
