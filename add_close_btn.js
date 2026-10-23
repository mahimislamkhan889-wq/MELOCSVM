import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const closeButtonStr = `<button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-black dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="mb-6 text-center">`;

content = content.replace(/<div className="mb-6 text-center">/, closeButtonStr);
fs.writeFileSync('src/App.tsx', content);
