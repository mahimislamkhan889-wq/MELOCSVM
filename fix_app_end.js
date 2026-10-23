import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// I will look for the end of AnimatePresence for viewingFileId and insert </>
content = content.replace(/      <\/AnimatePresence>\n    <\/div>\n  <\/div>\n\);\n\}/, "      </AnimatePresence>\n    </>\n  );\n}");

// Just in case it has different number of divs:
content = content.replace(/      <\/AnimatePresence>\n    <\/div>\n  \);\n\}/, "      </AnimatePresence>\n    </>\n  );\n}");

// Let's just do a direct replacement for the end of App:
// find the copy button component and replace the lines above it.
content = content.replace(/      <\/AnimatePresence>[\s\n]*<\/div>[\s\n]*<\/div>[\s\n]*\);\n\}/, "      </AnimatePresence>\n    </>\n  );\n}");
content = content.replace(/      <\/AnimatePresence>[\s\n]*<\/div>[\s\n]*\);\n\}/, "      </AnimatePresence>\n    </>\n  );\n}");
content = content.replace(/      <\/AnimatePresence>[\s\n]*\);\n\}/, "      </AnimatePresence>\n    </>\n  );\n}");

fs.writeFileSync('src/App.tsx', content);
