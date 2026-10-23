import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const stateCode = `  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('melo_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('melo_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('melo_theme', 'light');
    }
  }, [isDarkMode]);

  const [showAuthModal`;

content = content.replace(/const \[showAuthModal/, stateCode);

const headerEndRegex = /\{\!authLoading && \([\s\S]*?Login \/ Request Access[\s\S]*?<\/button>\s*<\/div>\s*\)\s*\)\s*\}/m;

const match = content.match(headerEndRegex);
if (match) {
  const newHeaderRight = `<div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors border border-white/10"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {!authLoading && (
              user ? (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10 overflow-hidden"
                >
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  Login / Request Access
                </button>
              )
            )}
          </div>`;
  content = content.replace(headerEndRegex, newHeaderRight);
}

fs.writeFileSync('src/App.tsx', content);
