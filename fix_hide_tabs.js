import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Strip the fragment tags I added
content = content.replace(/\{tab !== 'admin' && \(<\>\n                    \{\/\* Left Column: Settings \*\/\}/, '                    {/* Left Column: Settings */}');
content = content.replace(/<\/>\)\}\n        <\/div>\n      <\/main>/, '        </div>\n      </main>');

// Find the flex container that holds the left/right columns and hide it if admin
content = content.replace(/<div className="flex flex-col lg:flex-row gap-8">/, '<div className={cn("flex flex-col lg:flex-row gap-8", tab === "admin" && "hidden")}>');

fs.writeFileSync('src/App.tsx', content);
