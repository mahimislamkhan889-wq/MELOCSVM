import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('{/* Right Column: Upload & Results */}'));
const end = lines.findIndex(l => l.includes('</main>'));

for(let i=start; i<=end; i++) {
  const divOpens = (lines[i].match(/<div/g) || []).length;
  const divCloses = (lines[i].match(/<\/div>/g) || []).length;
  if(divOpens !== divCloses) {
    console.log(`L${i}: +${divOpens} -${divCloses} | ${lines[i].trim()}`);
  }
}
