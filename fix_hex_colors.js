import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The main hexes that are out of place:
content = content.replace(/bg-\[#31323B\]/g, 'bg-zinc-800/50');
content = content.replace(/bg-\[#2a2c33\]/g, 'bg-zinc-800/30');
content = content.replace(/bg-\[#202126\]/g, 'bg-black/40');
content = content.replace(/bg-\[#252630\]/g, 'bg-white/5');
content = content.replace(/bg-\[#393A45\]/g, 'bg-white/10');
content = content.replace(/bg-\[#424450\]/g, 'bg-white/10');
content = content.replace(/bg-\[#4B4C56\]/g, 'bg-white/5');

// Update border colors using old hexes too
content = content.replace(/border-\[#4B4C56\]/g, 'border-white/10');
content = content.replace(/border-\[#393A45\]/g, 'border-white/5');

// Text colors using old hexes
content = content.replace(/text-\[#A0A1AB\]/g, 'text-zinc-400');
content = content.replace(/text-\[#6E7182\]/g, 'text-zinc-500');

fs.writeFileSync('src/App.tsx', content);
