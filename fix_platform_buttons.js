import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\/\* Main Settings Card \*\/\}[\s\S]*?\{\/\* Toggles \*\/\}/;

const replacement = `{/* Main Settings Card */}
            <div className="bg-[#2D2E36] dark:bg-[#2D2E36] border-none rounded-2xl p-6 shadow-sm">
              <div className="space-y-6">
                
                {/* SEO Header */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <Settings size={20} className="text-white" />
                  </div>
                  <h2 className="text-[17px] font-black text-white tracking-wide uppercase">
                    SEO CUSTOMIZATION
                  </h2>
                </div>

                {/* Platform Selector */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-3 tracking-[0.2em] uppercase">Platform Target</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSettings(s => ({ ...s, platform: 'adobe' }))}
                      className={cn(
                        "flex flex-col items-center justify-center py-4 rounded-xl transition-all border-2",
                        settings.platform === 'adobe' 
                          ? "bg-[#424450] border-white text-white" 
                          : "bg-[#202126] border-transparent text-slate-400 hover:bg-[#2a2c33]"
                      )}
                    >
                      <span className="text-2xl font-black mb-1">A</span>
                      <span className="text-[9px] font-bold tracking-wider">ADOBE</span>
                    </button>
                    <button
                      onClick={() => setSettings(s => ({ ...s, platform: 'shutterstock' }))}
                      className={cn(
                        "flex flex-col items-center justify-center py-4 rounded-xl transition-all border-2",
                        settings.platform === 'shutterstock' 
                          ? "bg-[#424450] border-white text-white" 
                          : "bg-[#202126] border-transparent text-slate-400 hover:bg-[#2a2c33]"
                      )}
                    >
                      <span className="text-2xl font-black mb-1">S</span>
                      <span className="text-[9px] font-bold tracking-wider">SHUTTERSTOCK</span>
                    </button>
                    <button
                      onClick={() => setSettings(s => ({ ...s, platform: 'freepik' }))}
                      className={cn(
                        "flex flex-col items-center justify-center py-4 rounded-xl transition-all border-2",
                        settings.platform === 'freepik' 
                          ? "bg-[#424450] border-white text-white" 
                          : "bg-[#202126] border-transparent text-slate-400 hover:bg-[#2a2c33]"
                      )}
                    >
                      <span className="text-2xl font-black mb-1">F</span>
                      <span className="text-[9px] font-bold tracking-wider">FREEPIK</span>
                    </button>
                  </div>
                </div>

                <div className="h-px bg-white/5 w-full my-6" />

                <div className="space-y-6">
                  {tab === 'metadata' && (
                    <>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm mb-1">
                            <label className="text-[#a1a1aa] font-bold text-[11px] tracking-wider">Title Words</label>
                            <span className="text-white font-mono bg-[#40414F] px-2 py-0.5 rounded text-xs">{settings.titleWords}</span>
                          </div>
                          <input 
                            type="range" min="3" max="15" 
                            value={settings.titleWords}
                            onChange={(e) => setSettings(s => ({ ...s, titleWords: parseInt(e.target.value) }))}
                            className="w-full accent-white h-1.5 bg-[#202126] rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm mb-1">
                            <label className="text-[#a1a1aa] font-bold text-[11px] tracking-wider">Keywords count</label>
                            <span className="text-white font-mono bg-[#40414F] px-2 py-0.5 rounded text-xs">{settings.keywordWords}</span>
                          </div>
                          <input 
                            type="range" min="5" max="50"
                            value={settings.keywordWords}
                            onChange={(e) => setSettings(s => ({ ...s, keywordWords: parseInt(e.target.value) }))}
                            className="w-full accent-white h-1.5 bg-[#202126] rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {settings.platform === 'shutterstock' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm mb-1">
                              <label className="text-[#a1a1aa] font-bold text-[11px] tracking-wider">Description Words</label>
                              <span className="text-white font-mono bg-[#40414F] px-2 py-0.5 rounded text-xs">{settings.descriptionWords}</span>
                            </div>
                            <input 
                              type="range" min="5" max="50"
                              value={settings.descriptionWords}
                              onChange={(e) => setSettings(s => ({ ...s, descriptionWords: parseInt(e.target.value), descriptionEnabled: true }))}
                              className="w-full accent-white h-1.5 bg-[#202126] rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Toggles */}`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', content);
