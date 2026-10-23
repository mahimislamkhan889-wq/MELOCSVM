import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{files\.filter\(f => f\.status === 'done'\)\.length > 0 && \([\s\S]*?<\/button>\s*\)\}/;

const replacement = `<button 
                      onClick={handleDownloadCSV}
                      disabled={files.filter(f => f.status === 'done').length === 0}
                      className="px-6 py-2 bg-[#6E7182] disabled:bg-[#6E7182]/50 text-white disabled:text-transparent rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all border-none shadow-sm"
                    >
                      <span className={files.filter(f => f.status === 'done').length === 0 ? "hidden" : "flex items-center gap-2"}><Download size={16} /> Export {tab === 'prompt' ? 'TXT' : 'CSV'}</span>
                    </button>`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', content);
