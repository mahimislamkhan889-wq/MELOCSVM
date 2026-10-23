import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf8');

const start = content.indexOf('{/* Right Column: Upload & Results */}');
const end = content.indexOf('</main>');

const chunk = content.slice(start, end);

const opens = (chunk.match(/<div/g) || []).length;
const closes = (chunk.match(/<\/div>/g) || []).length;

console.log("Right column opens:", opens, "closes:", closes);
