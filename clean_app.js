import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The file might still contain user state if the regex failed. Let's just define user as null or remove references.
// We will replace the entire user profile JSX block and the Admin/Builder tabs.

// Remove Admin and Builder Tabs
content = content.replace(/\{user\?\.role === 'admin' && \([\s\S]*?\}\)/, '');
content = content.replace(/\{user\?\.role === 'builder' && \([\s\S]*?\}\)/, '');
content = content.replace(/\{user && \(\s*\(\s*tab === 'admin'[\s\S]*?currentUserId=\{user.uid\} \/>\s*\)\}/g, '');

// The profile menu: {!authLoading && ( user ? ... : ... )}
// Let's find it.
const authMenuStart = content.indexOf('{!authLoading && (');
if (authMenuStart !== -1) {
  let depth = 0;
  let authMenuEnd = -1;
  for (let i = authMenuStart; i < content.length; i++) {
    if (content[i] === '{') depth++;
    if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        authMenuEnd = i + 1;
        break;
      }
    }
  }
  if (authMenuEnd !== -1) {
    // Replace the block with nothing or just remove it
    // Wait, the block might be just inside the header.
    // Instead of complex logic, I'll use regex to match it roughly.
  }
}

// We will just replace all instances of "user." with something safe, or redefine user.
// Let's redefine user at the top to avoid errors: const user = null;
fs.writeFileSync('src/App.tsx', content);
