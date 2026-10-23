import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const profileModal = `
      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && user && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-[#3F404A] backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-2xl p-7 shadow-2xl relative"
            >
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white mx-auto mb-5 shadow-sm">
                  <User size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Your Profile</h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-white/70 text-xs font-medium uppercase tracking-wider mb-2">
                  {user.role} {user.role === 'admin' && <ShieldCheck size={14} className="text-[#006994]" />}
                </div>
                <p className="text-sm text-slate-400 font-mono">{user.phoneNumber}</p>
                {!user.hasAccess && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg text-sm flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span className="text-left">Your account is pending approval. You cannot process images yet.</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  auth.signOut();
                  setShowProfileModal(false);
                }}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

if (!content.includes('Profile Modal')) {
  content = content.replace('{/* Auth Modal */}', profileModal + '\n      {/* Auth Modal */}');
}

fs.writeFileSync('src/App.tsx', content);
