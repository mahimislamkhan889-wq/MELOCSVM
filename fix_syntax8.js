import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The `min-h-screen` div needs to be closed. So we swap `</>` and `</div>`.
content = content.replace(/<\/AnimatePresence>\n<\/>\n  <\/div>/, '</AnimatePresence>\n</div>\n</>');

fs.writeFileSync('src/App.tsx', content);
