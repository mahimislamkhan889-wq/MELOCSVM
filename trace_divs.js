import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf8');

let depth = 0;
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const opens = (line.match(/<[a-zA-Z][^>]*>/g) || []);
  const closes = (line.match(/<\/[a-zA-Z0-9]+>/g) || []);
  // simplified logic just for divs
  const divOpens = (line.match(/<div/g) || []).length;
  const divCloses = (line.match(/<\/div>/g) || []).length;
  depth += (divOpens - divCloses);
}
console.log(depth);
