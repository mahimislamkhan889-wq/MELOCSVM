import fs from 'fs';
let content = fs.readFileSync('src/index.css', 'utf8');

content = content.replace(/body \{/g, `
body {
  font-family: 'Plus Jakarta Sans', sans-serif;
`);

content += `
h1, h2, h3, h4, h5, h6, .font-display {
  font-family: 'Outfit', sans-serif;
}
`;

fs.writeFileSync('src/index.css', content);
