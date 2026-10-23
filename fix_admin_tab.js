import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Insert admin tab button if user is admin
const tabsRegex = /<button\s*onClick=\{\(\) => setTab\('prompt'\)\}\s*className=\{cn\(\s*"px-4 py-1\.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2",\s*tab === 'prompt' \? 'bg-\[\#3F404A\] text-white shadow-sm' : 'text-\[\#A0A1AB\] hover:text-white'\s*\)\}\s*>\s*<ImageIcon size=\{16\}\/> Image to Prompt\s*<\/button>/;

const newTabs = `<button
              onClick={() => setTab('prompt')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2",
                tab === 'prompt' ? 'bg-[#3F404A] text-white shadow-sm' : 'text-[#A0A1AB] hover:text-white'
              )}
            >
               <ImageIcon size={16}/> Image to Prompt
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setTab('admin')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2",
                  tab === 'admin' ? 'bg-[#3F404A] text-white shadow-sm' : 'text-[#A0A1AB] hover:text-white'
                )}
              >
                <ShieldCheck size={16}/> Admin
              </button>
            )}`;

content = content.replace(tabsRegex, newTabs);

// Render AdminPanel
const mainRegex = /<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">([\s\S]*?)<\/main>/;
const currentMain = content.match(mainRegex)[1];

const newMainContent = `<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {tab === 'admin' && user?.role === 'admin' ? (
          <AdminPanel />
        ) : (
          ${currentMain.trim()}
        )}
      </main>`;

content = content.replace(mainRegex, newMainContent);

fs.writeFileSync('src/App.tsx', content);
