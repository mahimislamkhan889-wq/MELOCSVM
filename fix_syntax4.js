import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// replace </div></div></div></main> with enough divs
content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/main>/, '</div></div></div></div></div></div></div></div></main>');

// check if there is a closing div at the end before </>
// Right now, before </>, there is </div>.
// Actually, I can just use a smarter script to fix it perfectly.
fs.writeFileSync('src/App.tsx', content);
