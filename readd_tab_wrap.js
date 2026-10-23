import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Insert `{tab !== 'admin' && (<>` right after the AdminPanel block.
content = content.replace(/          <\/div>\n        \)\}\n                    \{\/\* Left Column: Settings \*\/\}/g, 
"          </div>\n        )}\n{tab !== 'admin' && (<>\n                    {/* Left Column: Settings */}");

// Insert `</>)}` right before `</main>`
content = content.replace(/          <\/div>\n        <\/div>\n      <\/main>/g, 
"          </div>\n        </div>\n</>)}\n      </main>");

fs.writeFileSync('src/App.tsx', content);
console.log("Re-added tab wrapper");
