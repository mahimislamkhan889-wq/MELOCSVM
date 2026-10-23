import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// I'll replace `</div></div></div></div></div></div></main></div>` with `</div></div></div></div></main>`
content = content.replace(/<\/div><\/div><\/div><\/div><\/div><\/div><\/main><\/div>/, '</div></div></div></div></main>');

fs.writeFileSync('src/App.tsx', content);
