import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove old loginStep, tempPhoneNumber, isLoggingIn
content = content.replace(/  const \[loginStep, setLoginStep\] = useState\<'phone' \| 'google'\>\('phone'\);\n/g, '');
content = content.replace(/  const \[tempPhoneNumber, setTempPhoneNumber\] = useState\(''\);\n/g, '');
content = content.replace(/  const \[isLoggingIn, setIsLoggingIn\] = useState\(false\);\n/g, '');

// Remove old showAuthModal and isPendingAccess that were statically assigned to false
content = content.replace(/  const showAuthModal = false;\n/g, '');
content = content.replace(/  const isPendingAccess = false;\n/g, '');

fs.writeFileSync('src/App.tsx', content);
console.log("Fixed duplicates");
