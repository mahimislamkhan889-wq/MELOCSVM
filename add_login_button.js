import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const originalBlock = `          {user && (
            <div className="flex items-center gap-4 relative z-10">
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors border border-black/10 dark:border-white/10"
              >
                <User size={14} />
              </button>
            </div>
          )}`;

const newBlock = `          {!authLoading && (
            user ? (
              <div className="flex items-center gap-4 relative z-10">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors border border-black/10 dark:border-white/10"
                >
                  <User size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 relative z-10">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  Login / Request Access
                </button>
              </div>
            )
          )}`;

content = content.replace(originalBlock, newBlock);
fs.writeFileSync('src/App.tsx', content);
console.log("Login button added.");
