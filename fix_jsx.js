import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /{loginStep === 'phone' \? \([\s\S]*?<form onSubmit=\{handleSendOtp\} className="space-y-4">/;
content = content.replace(regex, "{loginStep === 'phone' ? (<div className=\"w-full\">\n                <form onSubmit={handleSendOtp} className=\"space-y-4\">");

content = content.replace(/Admin Login\n                <\/button>\n              \) : \(/, "Admin Login\n                </button>\n              </div>) : (");

fs.writeFileSync('src/App.tsx', content);
