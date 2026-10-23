import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const adminBlock = `        {user && tab === 'admin' && (
          <div className="w-full">
            <AdminPanel />
          </div>
        )}`;

content = content.replace(adminBlock, '');

// Insert it right after <main> and before <div className={cn("flex...
content = content.replace(/<main className="max-w-7xl mx-auto px-4 py-8 relative z-10">\n        <div className=\{cn\("flex flex-col lg:flex-row gap-8", tab === "admin" && "hidden"\)\}>/g, 
`<main className="max-w-7xl mx-auto px-4 py-8 relative z-10">\n${adminBlock}\n        <div className={cn("flex flex-col lg:flex-row gap-8", tab === "admin" && "hidden")}>`);

fs.writeFileSync('src/App.tsx', content);
