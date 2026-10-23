import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Ensure isPendingAccess is always false so it doesn't block processing
content = content.replace(/const isPendingAccess = user && !user\.hasAccess;/g, 'const isPendingAccess = false;');

// Remove the alert about pending access inside the handleProcess button
content = content.replace(/\} else if \(isPendingAccess\) \{\n\s*alert\("Your account is pending admin approval\. Please wait\."\);\n\s*/g, '');
// Replace `|| isPendingAccess ` with ``
content = content.replace(/ \|\| isPendingAccess /g, '');

// Also when phone user registers, make them default to hasAccess: true and role: builder
content = content.replace(/role: 'pending',\n\s*hasAccess: false/g, "role: 'builder',\n          hasAccess: true");

fs.writeFileSync('src/App.tsx', content);
