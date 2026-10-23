import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
let leftIdx = content.indexOf('Left Column: Settings');
let rightIdx = content.indexOf('Right Column: Upload & Results');
let leftContent = content.substring(leftIdx, rightIdx);
let openDivs = (leftContent.match(/<div/g) || []).length;
let closeDivs = (leftContent.match(/<\/div>/g) || []).length;
console.log("Left column opens:", openDivs, "closes:", closeDivs);
