import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The issue might be that I added `</>)}</div>` randomly and caused a mismatch.
// Let's strip out the `{tab !== 'admin' && (<>` and `</>)}` entirely to see if it compiles!

content = content.replace(/\{tab \!== 'admin' && \(\<\>\n/g, "");
content = content.replace(/<\/>\)\}\n<\/div>\n      <\/main>/g, "</div>\n      </main>");

fs.writeFileSync('src/App.tsx', content);
