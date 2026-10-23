import fs from 'fs';

const files = ['src/components/AdminPanel.tsx', 'src/components/ApiConfigModal.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-slate-50\b(?!(\/|0))/g, 'bg-slate-100');
  content = content.replace(/bg-slate-50\//g, 'bg-slate-100/');
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
