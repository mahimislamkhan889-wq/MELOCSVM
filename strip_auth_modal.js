import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The Auth Modal
const startModal = content.indexOf('{/* Auth Modal */}');
if (startModal !== -1) {
  const endModal = content.indexOf('</AnimatePresence>', startModal);
  if (endModal !== -1) {
    content = content.slice(0, startModal) + content.slice(endModal + '</AnimatePresence>'.length);
  }
}

fs.writeFileSync('src/App.tsx', content);
