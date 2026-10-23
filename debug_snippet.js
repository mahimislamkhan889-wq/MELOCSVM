import fs from 'fs';
const snippet = fs.readFileSync('rebuild_app.js', 'utf8');
const lines = snippet.split('\n');
let depth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const divOpens = (line.match(/<div/g) || []).length;
  const divCloses = (line.match(/<\/div>/g) || []).length;
  depth += (divOpens - divCloses);
  if (divOpens > 0 || divCloses > 0) {
    console.log(i + 1, depth, line.trim());
  }
}
