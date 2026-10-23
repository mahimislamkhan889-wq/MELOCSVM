import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// I'll grab the file and manually trim it via regex that doesn't rely on formatting.
const startToken = '<ImageIcon size={16}/> Image to Prompt</div>\\s*</button>';
const endToken = '<label className="text-neutral-700 dark:text-neutral-300 font-medium">Keywords count</label>';

const re = new RegExp(startToken + '[\\s\\S]*?' + endToken);

const fixedSection = `<ImageIcon size={16}/> Image to Prompt</div>
            </button>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative inline-flex items-center h-8 w-[64px] rounded-full bg-neutral-200/70 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 transition-colors focus:outline-none shadow-inner overflow-hidden hover:bg-neutral-200 dark:hover:bg-neutral-800"
            >
              <span className="sr-only">Toggle theme</span>
              <div className="absolute inset-0 flex items-center justify-between px-2">
                <Sun size={14} className="text-neutral-500 dark:text-neutral-500" />
                <Moon size={14} className="text-neutral-500 dark:text-neutral-500" />
              </div>
              <div
                className={cn(
                  "absolute left-1 w-6 h-6 rounded-full transition-transform duration-300 flex items-center justify-center",
                  "bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-white/10 z-10",
                  theme === 'dark' ? "translate-x-[32px]" : "translate-x-0"
                )}
              >
                {theme === 'dark' ? <Moon size={14} className="text-white" /> : <Sun size={14} className="text-black dark:text-white" />}
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Settings */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
            
            {/* Main Settings Card */}
            <div className="bg-white/40 dark:bg-black/40 backdrop-blur-3xl border border-neutral-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="space-y-6">
                
                {/* Platform Selector */}
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-3">Platform Target</label>
                  <div className="flex bg-neutral-100/50 dark:bg-black/50 p-1 rounded-xl border border-neutral-200 dark:border-white/5 relative">
                    <button
                      onClick={() => setSettings(s => ({ ...s, platform: 'adobe' }))}
                      className={cn(
                        "flex-1 py-2 text-sm font-bold rounded-lg transition-all relative z-10",
                        settings.platform === 'adobe' 
                          ? "text-black dark:text-white" 
                          : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-600 dark:text-neutral-300"
                      )}
                    >
                      Adobe
                    </button>
                    <button
                      onClick={() => setSettings(s => ({ ...s, platform: 'shutterstock' }))}
                      className={cn(
                        "flex-1 py-2 text-sm font-bold rounded-lg transition-all relative z-10",
                        settings.platform === 'shutterstock' 
                          ? "text-black dark:text-white" 
                          : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-600 dark:text-neutral-300"
                      )}
                    >
                      Shutterstock
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {tab === 'metadata' && (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <label className="text-neutral-600 dark:text-neutral-300 font-medium">Title Words</label>
                            <span className="text-black dark:text-white font-mono bg-black/5 dark:bg-white/5 px-2 rounded-md">{settings.titleWords}</span>
                          </div>
                          <input 
                            type="range" min="3" max="15" 
                            value={settings.titleWords}
                            onChange={(e) => setSettings(s => ({ ...s, titleWords: parseInt(e.target.value) }))}
                            className="w-full accent-black dark:accent-white h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <label className="text-neutral-700 dark:text-neutral-300 font-medium">Keywords count</label>`;

content = content.replace(re, fixedSection);
fs.writeFileSync('src/App.tsx', content);
console.log("Forced patch executed.");
