import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// I'll wrap the entire return statement in a fragment.
// Find `return (` and replace it with `return ( <>`
// Then find the end of the return statement which is `\n  );\n}` and replace with `\n  </>\n  );\n}`

content = content.replace(/return \(\s*\{\/\* Auth Modal \*\/\}/g, 'return (\n    <>\n      {/* Auth Modal */}');
content = content.replace(/<\/div>\n  \);\n\}/g, '</div>\n    </>\n  );\n}');

fs.writeFileSync('src/App.tsx', content);
console.log("Fixed return wrapping");
