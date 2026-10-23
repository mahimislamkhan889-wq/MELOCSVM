import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace 4 divs with 3 divs
content = content.replace(/<\/div><\/div><\/div><\/div><\/main>/, '</div></div></div></main>');

// At the bottom, remove the two extra divs before </>
content = content.replace(/<\/div>\n<\/div>\n<\/>/, '</>\n  </div>'); // Wait, `<div min-h-screen>` wraps the WHOLE APP.
// Wait! `min-h-screen` wraps `<header>`, `<main>`, and `<footer>`!
// So it must be closed AFTER `<footer>` and modals!
// Let's replace the end:
content = content.replace(/<\/AnimatePresence>\n<\/div>\n<\/div>\n<\/>/g, '</AnimatePresence>\n</div>\n</>');

fs.writeFileSync('src/App.tsx', content);
