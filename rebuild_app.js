import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `
      <div className="min-h-screen bg-[#383944] text-white font-sans selection:bg-white/30 relative overflow-hidden">
      
      <header className="bg-[#2A2B33] border-b border-[#21222A] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-left z-10">
            <div className="bg-white p-1.5 rounded-lg text-black shadow-md">
              <Bug size={24} strokeWidth={2.5} />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-white flex gap-1.5 items-center">
              Melo
            </h1>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex bg-[#222329] p-1 rounded-xl border border-[#1A1A1E] overflow-hidden z-10 whitespace-nowrap">
            <button
              onClick={() => setTab('metadata')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2",
                tab === 'metadata' ? 'bg-[#3F404A] text-white shadow-sm' : 'text-[#A0A1AB] hover:text-white'
              )}
            >
              <Settings size={16}/> Metadata
            </button>
            <button
              onClick={() => {}}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2",
                'text-[#A0A1AB] hover:text-white'
              )}
            >
               <ImageIcon size={16}/> Image to Prompt
            </button>
          </div>

          {!authLoading && (
            user ? (
              <div className="flex items-center gap-4 relative z-10">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"
                >
                  <User size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 relative z-10">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  Login / Request Access
                </button>
              </div>
            )
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Settings */}
          <div className="w-full lg:col-span-4 flex-shrink-0 space-y-6">
            <div className="bg-[#31323B] border-none rounded-2xl p-6 shadow-sm">
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

                  {/* Toggles */}
                  <div className="space-y-3 border-t border-white/5 pt-5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Modifiers</label>
                    
                    {tab === 'metadata' && (
                      <ToggleRow 
                        label="Single Word Keywords" 
                        checked={settings.singleWordKeywords}
                        onChange={(v) => setSettings(s => ({ ...s, singleWordKeywords: v }))}
                      />
                    )}

                    <ToggleRow 
                      label="Silhouette" 
                      checked={settings.silhouette}
                      onChange={(v) => setSettings(s => ({ ...s, silhouette: v }))}
                    />

                    <ToggleRow 
                      label="Transparent Background" 
                      checked={settings.transparentBackground}
                      onChange={(v) => setSettings(s => ({ ...s, transparentBackground: v }))}
                    />

                    <ToggleRow 
                      label="Extra Text" 
                      checked={settings.extraText}
                      onChange={(v) => setSettings(s => ({ ...s, extraText: v }))}
                    />
                  </div>

                  <div className="pt-2">
                    <div className="relative">
                      <button onClick={() => setSettings(s => ({ ...s, showApiConfig: !s.showApiConfig }))} className="w-full flex items-center justify-between py-3 px-4 bg-[#393A45] hover:bg-[#40414F] text-white rounded-xl transition-all border border-[#21222A]">
                        <span className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold"><Key size={14} /> ADD API KEY</span>
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Upload & Results */}`;

content = content.replace(/<div className="min-h-screen bg-\[\#3B3C46\] text-white font-sans selection:bg-white\/30 relative overflow-hidden">[\s\S]*?\{\/\* Right Column: Upload & Results \*\/\}/, replacement);

fs.writeFileSync('src/App.tsx', content);
