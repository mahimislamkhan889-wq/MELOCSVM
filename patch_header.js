import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldHeaderRight = `<div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-white/5 flex items-center justify-center text-zinc-900 dark:text-zinc-50 hover:bg-white/10 transition-colors border border-zinc-200 dark:border-white/5"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>`;

const newHeaderRight = `<div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => setShowApiSettings(true)}
              className="px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors font-bold text-xs gap-1.5 shadow-sm"
              title="Configure API Key"
            >
              <Key size={14} /> <span>API Config</span>
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-white/5 flex items-center justify-center text-zinc-900 dark:text-zinc-50 hover:bg-white/10 transition-colors border border-zinc-200 dark:border-white/5"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>`;

content = content.replace(oldHeaderRight, newHeaderRight);
fs.writeFileSync('src/App.tsx', content);
