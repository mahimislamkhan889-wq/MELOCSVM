import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/groupFiles\.length/g, '(groupFiles as MediaFile[]).length');
content = content.replace(/groupFiles\.map/g, '(groupFiles as MediaFile[]).map');

fs.writeFileSync('src/App.tsx', content);
