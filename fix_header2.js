import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The block starts with `{!authLoading && (`
const start = content.indexOf('{!authLoading && (');
if (start !== -1) {
  const end = content.indexOf(')}', content.indexOf('Login / Request Access'));
  if (end !== -1) {
    content = content.slice(0, start) + content.slice(end + 2);
  }
}

content = content.replace(/if \(false\) \{\n\s*setShowAuthModal\(true\);\n\s*\} else \{\n\s*handleProcess\(\);\n\s*\}/g, 'handleProcess();');

fs.writeFileSync('src/App.tsx', content);
