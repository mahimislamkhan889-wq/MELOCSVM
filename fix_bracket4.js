import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// I will just split by lines and replace the specific line
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('</main>')) {
    if (lines[i-1].includes(')}')) {
      lines[i-1] = lines[i-1].replace(')}', '</div>');
    }
  }
}
fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log("Fixed bracket 4");
