import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('src/firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);

signInAnonymously(auth).then(user => {
  console.log("Anonymous Auth Success!", user.user.uid);
  process.exit(0);
}).catch(err => {
  console.error("Anonymous Auth Failed:", err.message);
  process.exit(1);
});
