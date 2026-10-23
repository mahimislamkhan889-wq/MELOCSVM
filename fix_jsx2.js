import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The starting tag
content = content.replace(/{loginStep === 'phone' \? \(<form onSubmit=\{handleSendOtp\}/, "{loginStep === 'phone' ? (<div className=\"w-full\">\n<form onSubmit={handleSendOtp}");

// The ending tag before ) : (
content = content.replace(/Admin Login\n                <\/button>/, "Admin Login\n                </button>\n              </div>");

fs.writeFileSync('src/App.tsx', content);
