import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/dark:bg-black dark:bg-\[\#31323B\]/g, "dark:bg-[#31323B]");
content = content.replace(/dark:bg-white dark:bg-\[\#2A2B33\]/g, "dark:bg-[#2A2B33]");
content = content.replace(/dark:bg-white dark:bg-\[\#3F404A\]/g, "dark:bg-[#3F404A]");

fs.writeFileSync('src/App.tsx', content);
