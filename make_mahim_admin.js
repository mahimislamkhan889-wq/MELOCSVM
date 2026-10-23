import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('src/firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    await updateDoc(doc(db, 'users', '+8801948481216'), {
      role: 'admin',
      hasAccess: true
    });
    console.log("Updated +8801948481216 to admin");
    
    await updateDoc(doc(db, 'users', 'mahim '), {
      role: 'admin',
      hasAccess: true
    });
    console.log("Updated mahim to admin");
    
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();
