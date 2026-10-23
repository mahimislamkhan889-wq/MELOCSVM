import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/\{user\?\.role === 'admin' && \([\s\S]*?<ShieldCheck size=\{16\}\/> Admin\n\s*<\/button>\n\s*\)\}/g, '');

content = content.replace(/<button\n\s*onClick=\{\(\) => setShowProfileModal\(true\)\}[\s\S]*?<\/button>/g, `<button
                  onClick={() => {
                    if (confirm('Are you sure you want to sign out?')) {
                      localStorage.removeItem('melo_user_phone');
                      auth.signOut().then(() => window.location.reload());
                    }
                  }}
                  className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20 overflow-hidden"
                  title="Sign Out"
                >
                  <LogOut size={14} />
                </button>`);

fs.writeFileSync('src/App.tsx', content);
