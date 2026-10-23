import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
const mainMatch = content.match(/<main[\s\S]*?<\/main>/);
if (mainMatch) {
    console.log(mainMatch[0].substring(0, 1500));
}
