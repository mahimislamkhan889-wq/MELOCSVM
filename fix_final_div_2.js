import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The App component return ends with </AnimatePresence> \n </div> \n </> \n ); \n }
// Let's replace it with </AnimatePresence> \n </div> \n </div> \n </> \n ); \n }
content = content.replace(/      <\/AnimatePresence>[\s\n]*<\/div>[\s\n]*<\/>[\s\n]*\);\n\}/, "      </AnimatePresence>\n    </div>\n    </div>\n    </>\n  );\n}");

fs.writeFileSync('src/App.tsx', content);
