import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf8');

const opens = (content.match(/<div/g) || []).length;
const closes = (content.match(/<\/div>/g) || []).length;

console.log("Total opens:", opens, "Total closes:", closes);
