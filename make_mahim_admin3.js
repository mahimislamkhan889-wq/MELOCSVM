import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('src/firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    await setDoc(doc(db, 'users', '+01942642389'), {
      role: 'admin',
      hasAccess: true
    }, { merge: true });
    console.log("Updated +01942642389 to admin");
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
