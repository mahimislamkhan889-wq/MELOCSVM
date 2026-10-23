import fs from 'fs';
let content = fs.readFileSync('src/index.css', 'utf8');

if (!content.includes('@theme')) {
  const theme = `
@theme {
  --font-sans: 'Plus Jakarta Sans', sans-serif;
  --font-display: 'Outfit', sans-serif;
}
`;
  content = content.replace(/@import "tailwindcss";/, '@import "tailwindcss";\n' + theme);
}

fs.writeFileSync('src/index.css', content);
