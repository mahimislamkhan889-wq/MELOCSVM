import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The profile modal has this:
// <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white mx-auto mb-5 shadow-sm">
//   <User size={32} />
// </div>

const userIconRegex = /<div className="w-16 h-16 bg-white\/10 rounded-full flex items-center justify-center text-white mx-auto mb-5 shadow-sm">\s*<User size=\{32\} \/>\s*<\/div>/;
const newProfileIcon = `
                {user.profilePic ? (
                  <div className="w-20 h-20 rounded-full mx-auto mb-5 shadow-sm border border-white/10 overflow-hidden">
                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white mx-auto mb-5 shadow-sm">
                    <User size={32} />
                  </div>
                )}`;

content = content.replace(userIconRegex, newProfileIcon);

// Top right profile icon:
// <button
//   onClick={() => setShowProfileModal(true)}
//   className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10"
// >
//   <User size={14} />
// </button>

const topIconRegex = /<button\s*onClick=\{\(\) => setShowProfileModal\(true\)\}\s*className="w-8 h-8 rounded-full bg-white\/10 flex items-center justify-center text-white hover:bg-white\/20 transition-colors border border-white\/10"\s*>\s*<User size=\{14\} \/>\s*<\/button>/;

const newTopIcon = `<button
                  onClick={() => setShowProfileModal(true)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10 overflow-hidden"
                >
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} />
                  )}
                </button>`;

content = content.replace(topIconRegex, newTopIcon);

fs.writeFileSync('src/App.tsx', content);
console.log("Done updating profile icon usage");
