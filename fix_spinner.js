import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The spinner inside the "Process All" button
content = content.replace(
  /<div className="w-4 h-4 border-2 border-\[\#006994\]\/30 border-t-\[\#006994\] rounded-full animate-spin"\/>/g,
  '<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>'
);

// Processing spinner on individual files
content = content.replace(
  /border-t-black dark:border-t-white rounded-full animate-spin border-transparent shadow-\[0_0_10px_rgba\(34,211,238,0\.5\)\]/g,
  'border-t-black dark:border-t-white rounded-full animate-spin border-transparent' // Remove the cheap cyan glow
);

fs.writeFileSync('src/App.tsx', content);
