import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Fix '({}).hasAccess' back to 'user?.hasAccess'
content = content.replace(/\(\{\}\)\./g, 'user?.');

// Fix setIsLoggingIn
content = content.replace(/setIsLoggingIn/g, 'setShowAuthModal'); // Since it's about opening the modal

// Let's see what is on 1075 and 1078. It says property 'length' and 'map' do not exist on type 'unknown'.
// Probably something like Object.keys or a variable.
// I'll leave a simple script to check 1070-1080.
fs.writeFileSync('src/App.tsx', content);
