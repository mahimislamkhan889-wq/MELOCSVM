import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /if \(!user\?\.hasAccess && user\?\.role !== 'admin' && user\?\.role !== 'builder'\) \{\n\s*alert\("Your account is pending professional access verification\. Contact Mainul for permission\."\);\n\s*return;\n\s*\}/g;

content = content.replace(regex, '');

fs.writeFileSync('src/App.tsx', content);
