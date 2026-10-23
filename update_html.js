import fs from 'fs';
let content = fs.readFileSync('index.html', 'utf8');

const fontLinks = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
`;

if (!content.includes('fonts.googleapis.com')) {
    content = content.replace('<title>', fontLinks + '<title>');
}

fs.writeFileSync('index.html', content);
