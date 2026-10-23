import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldExportBtnStr = `{files.filter(f => f.status === 'done').length > 0 && (
                    <button 
                      onClick={handleDownloadCSV}
                      className="px-4 py-2 bg-[#3F404A] backdrop-blur-xl hover:bg-white/60 dark:bg-slate-900/60 text-white rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all border border-slate-200 dark:border-white/5 shadow-sm active:scale-95"
                    >
                      <Download size={16} /> Export {tab === 'prompt' ? 'TXT' : 'CSV'}
                    </button>
                  )}`;

// Wait, I should just grep what the exact string is.
