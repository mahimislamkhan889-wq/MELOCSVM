import fs from 'fs';
const snippet = fs.readFileSync('rebuild_app.js', 'utf8');

let depth = 0;
const lines = snippet.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const divOpens = (line.match(/<div/g) || []).length;
  const divCloses = (line.match(/<\/div>/g) || []).length;
  depth += (divOpens - divCloses);
}
console.log(depth);
