import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf8');

let depth = 0;
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const openCount = (line.match(/<div/g) || []).length;
  const closeCount = (line.match(/<\/div>/g) || []).length;
  depth += (openCount - closeCount);
  if (depth < 0) {
    console.log(`Negative depth at line ${i + 1}: ${line}`);
    depth = 0;
  }
}
console.log("Final depth:", depth);
