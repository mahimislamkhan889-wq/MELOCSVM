import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const authModalUI = `
      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-100/80 dark:bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-neutral-100/40 dark:bg-black/40 backdrop-blur-3xl border border-neutral-200 dark:border-white/10 rounded-2xl p-7 shadow-2xl relative"
            >
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-black/5 dark:bg-white/10 rounded-2xl flex items-center justify-center text-black dark:text-white mx-auto mb-5 border border-black/20 dark:border-white/20 shadow-sm">
                  <Phone size={32} strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold text-black dark:text-white mb-2 tracking-tight">Welcome to Melo</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Login to process your assets.</p>
              </div>

              {loginStep === 'phone' ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-black dark:text-white mb-1.5 uppercase tracking-wider">Name</label>
                    <input
                      type="text"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      placeholder="e.g. Mainul Islam"
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 transition-shadow"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black dark:text-white mb-1.5 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="+8801XXXXXXXXX"
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 transition-shadow"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-black dark:bg-white text-white dark:text-black rounded-xl px-4 py-3 text-sm font-bold shadow-lg shadow-black/10 dark:shadow-white/10 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    Send Code <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-black dark:text-white mb-1.5 uppercase tracking-wider">Verification Code</label>
                    <input
                      type="text"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value)}
                      placeholder="6-digit code"
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 transition-shadow text-center font-mono tracking-widest text-lg"
                      required
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-black dark:bg-white text-white dark:text-black rounded-xl px-4 py-3 text-sm font-bold shadow-lg shadow-black/10 dark:shadow-white/10 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    Verify & Login
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginStep('phone')}
                    className="w-full text-xs text-neutral-500 hover:text-black dark:hover:text-white transition-colors py-2"
                  >
                    Back to phone number
                  </button>
                </form>
              )}

              {loginError && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span className="flex-1 leading-relaxed">{loginError}</span>
                </div>
              )}
              
              <div id="recaptcha-container"></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

content = content.replace(/<div className="min-h-screen/, authModalUI + '\n<div className="min-h-screen');

const headerAdditions = `
          {user && (
            <div className="flex items-center gap-4 relative z-10">
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/20 transition-colors border border-black/10 dark:border-white/10"
              >
                <User size={14} />
              </button>
            </div>
          )}
`;

content = content.replace(/<div className="flex items-center gap-4 relative z-10">/, headerAdditions + '\n<div className="flex items-center gap-4 relative z-10">');

// Add Profile Modal
const profileModalUI = `
      <AnimatePresence>
        {showProfileModal && user && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-2xl p-6 shadow-xl relative"
            >
              <button
                onClick={() => setShowProfileModal(false)}
                className="absolute top-4 right-4 text-neutral-500 hover:text-black dark:hover:text-white"
              >
                <X size={20} />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-200 dark:border-white/10">
                  <User size={32} className="text-neutral-400" />
                </div>
                <h3 className="text-xl font-bold text-black dark:text-white">{user.name || 'User'}</h3>
                <p className="text-sm text-neutral-500 font-mono mt-1">{user.phoneNumber}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-medium uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                  <ShieldCheck size={14} />
                  {user.role}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-neutral-100 dark:border-white/5">
                <button
                  onClick={() => {
                    signOut(auth);
                    setShowProfileModal(false);
                  }}
                  className="w-full py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

content = content.replace(/<main/, profileModalUI + '\n<main');


fs.writeFileSync('src/App.tsx', content);
console.log("Added Auth UI");
