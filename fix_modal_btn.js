import fs from 'fs';
let content = fs.readFileSync('src/components/ApiConfigModal.tsx', 'utf8');

content = content.replace(/bg-black dark:bg-white hover:bg-black dark:bg-white text-neutral-500/g, 'bg-black dark:bg-white text-white dark:text-black');

fs.writeFileSync('src/components/ApiConfigModal.tsx', content);
