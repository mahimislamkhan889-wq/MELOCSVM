import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

let lines = content.split('\n');
console.log("Total lines:", lines.length);

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function App')) {
    console.log("App starts at", i + 1);
  }
  if (lines[i].includes('<ApiConfigModal')) {
    console.log("ApiConfigModal starts at", i + 1);
  }
}
