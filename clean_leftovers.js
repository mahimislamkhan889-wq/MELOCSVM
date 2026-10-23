import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The block around line 176 to the end of the initAuth useEffect. Let's find the large useEffect.
const regexEffect = /useEffect\(\(\) => \{\n\s*let isMounted = true;[\s\S]*?return \(\) => \{\n\s*isMounted = false;[\s\S]*?\}\n\s*\}, \[\]\);\n/g;
content = content.replace(regexEffect, '');

// Also remove updateLastActive block
const updateLastActiveRegex = /const updateLastActive = async[\s\S]*?syncUserProfile\(auth\.currentUser\);\n\s*\}\n\s*\}, 5 \* 60 \* 1000\);\n\n\s*return \(\) => clearInterval\(interval\);\n\s*\}, \[\(\{\}\)\.uid\]\);\n/g;
content = content.replace(updateLastActiveRegex, '');

content = content.replace(/if \(false\) await syncUserProfile\(auth\.currentUser\);\n/g, '');

fs.writeFileSync('src/App.tsx', content);
