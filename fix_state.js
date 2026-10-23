import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(/const showAuthModal = !authLoading && !user;/, "const [showAuthModal, setShowAuthModal] = useState(false);");
fs.writeFileSync('src/App.tsx', content);
