import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/import \{ Phone, ArrowRight, X, Moon, Sun \} from 'lucide-react';/, "import { Phone, ArrowRight, X, Moon, Sun, Camera } from 'lucide-react';");
fs.writeFileSync('src/App.tsx', content);
