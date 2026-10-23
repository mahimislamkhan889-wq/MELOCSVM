import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add profilePicUrl to UserProfile
if (!content.includes('profilePic?: string')) {
  content = content.replace(
    /role: 'admin' \| 'builder' \| 'pending';/,
    `role: 'admin' | 'builder' | 'pending';\n  profilePic?: string;`
  );
}

// 2. Add profilePicUrl to setDoc
content = content.replace(
  /name: loginName,\s*role: 'pending',/,
  `name: loginName,\n          profilePic: profilePicUrl,\n          role: 'pending',`
);

fs.writeFileSync('src/App.tsx', content);
console.log("Done updating user save");
