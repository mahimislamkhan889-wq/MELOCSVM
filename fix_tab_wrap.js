import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The readd_tab_wrap.js did:
// "          </div>\n        </div>\n</>)}\n      </main>"
// We need to move `</>)}` up by one `</div>`.

content = content.replace(/          <\/div>\n        <\/div>\n<\/>\)\}\n      <\/main>/g, 
"          </div>\n</>)}\n        </div>\n      </main>");

fs.writeFileSync('src/App.tsx', content);
