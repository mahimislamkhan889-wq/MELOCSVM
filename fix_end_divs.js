import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// I need to make sure the app closes properly.
// The main <App> structure is now:
// <div min-h-screen>
//   <header> ... </header>
//   <main>
//     <div grid>
//       <div col-4> ... </div>
//       <div col-8> ... </div>
//     </div>
//   </main>
// </div>

// Check the end of the file.
content = content.replace(/<\/div>\s*<\/div>\s*<\/>\s*\);\s*\}/, '</div>\n</div>\n</main>\n</div>\n</>\n);\n}');
fs.writeFileSync('src/App.tsx', content);
