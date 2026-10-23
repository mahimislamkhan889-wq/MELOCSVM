import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');
let depth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const divOpens = (line.match(/<div/g) || []).length;
  const divCloses = (line.match(/<\/div>/g) || []).length;
  depth += (divOpens - divCloses);
}
console.log(depth);
