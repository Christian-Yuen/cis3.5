import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBk19z0f3n7ixniq-f7Bq1Zj4NYIXAZ7oI',
  authDomain: 'shareable-37f85.firebaseapp.com',
  projectId: 'shareable-37f85',
  storageBucket: 'shareable-37f85.appspot.com',
  messagingSenderId: '542630327474',
  appId: '1:542630327474:web:8258d25c6c24e0384185ab',
  measurementId: 'G-C3YDL8XPHE',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

// ✅ Add persistence for authentication
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log('Persistence ready'))
  .catch(console.error);

if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  // optional emulator line - uncomment if using Firebase Auth emulator
  // connectAuthEmulator(auth, 'http://localhost:9099');
  console.log('Running from localhost – allowed by Firebase Auth settings');
}

export { db, auth };
