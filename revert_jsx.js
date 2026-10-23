import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/{loginStep === 'phone' \? \(<div className="w-full">\n                <form onSubmit=\{handleSendOtp\}/, "{loginStep === 'phone' ? (<form onSubmit={handleSendOtp}");

content = content.replace(/<\/button>\n              <\/div>\) : \(/, "</button>\n              ) : (");

fs.writeFileSync('src/App.tsx', content);
