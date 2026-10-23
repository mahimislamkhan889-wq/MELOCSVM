import fs from 'fs';
import { transformSync } from 'esbuild';

const content = fs.readFileSync('src/App.tsx', 'utf8');

try {
  transformSync(content, { loader: 'tsx' });
  console.log("Success");
} catch (e) {
  console.log(e.message);
}
