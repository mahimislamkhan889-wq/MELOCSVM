import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const tabButtons = `
            {user?.role === 'admin' && (
              <button
                onClick={() => setTab('admin')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300",
                  tab === 'admin' ? "bg-black/10 dark:bg-white/10 dark:bg-black/20 dark:bg-white/20 text-black dark:text-white shadow-md" : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:text-white hover:bg-neutral-100 dark:bg-white/5"
                )}
              >
                <div className="flex items-center gap-2"><ShieldCheck size={16}/> Admin</div>
              </button>
            )}
            {user?.role === 'builder' && (
              <button
                onClick={() => setTab('builder')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300",
                  tab === 'builder' ? "bg-black/10 dark:bg-white/10 dark:bg-black/20 dark:bg-white/20 text-black dark:text-white shadow-md" : "text-neutral-500 dark:text-neutral-400 hover:text-black dark:text-white hover:bg-neutral-100 dark:bg-white/5"
                )}
              >
                <div className="flex items-center gap-2"><Settings size={16}/> Builder</div>
              </button>
            )}
`;

content = content.replace(/<div className="absolute left-1\/2 -translate-x-1\/2 flex bg-neutral-100\/50 dark:bg-black\/50 p-1 rounded-xl border border-neutral-200 dark:border-white\/5 overflow-hidden z-10 whitespace-nowrap">/, '<div className="absolute left-1/2 -translate-x-1/2 flex bg-neutral-100/50 dark:bg-black/50 p-1 rounded-xl border border-neutral-200 dark:border-white/5 overflow-hidden z-10 whitespace-nowrap">' + tabButtons);

const renderAdminPanel = `
        {user && tab === 'admin' && (
          <div className="w-full">
            <AdminPanel />
          </div>
        )}
`;

// Insert it right after `<div className="flex flex-col lg:flex-row gap-8">` but before the Left Column if tab !== admin
// Wait, the existing layout has `<div className="flex flex-col lg:flex-row gap-8">`
// Let's wrap the settings and results in a condition `tab !== 'admin' && (`

content = content.replace(/<div className="flex flex-col lg:flex-row gap-8">/, `<div className="flex flex-col lg:flex-row gap-8">\n${renderAdminPanel}\n{tab !== 'admin' && (`);

// And we need to close the `tab !== 'admin'` wrapper before `</main>`
content = content.replace(/<\/div>\n[ \t]*<\/main>/, `</div>\n)}\n      </main>`);

fs.writeFileSync('src/App.tsx', content);
console.log("Injected tabs");
