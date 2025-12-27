import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-auth.js';


const firebaseConfig = {
  apiKey: 'AIzaSyBk19z0f3n7ixniq-f7Bq1Zj4NYIXAZ7oI',
  authDomain: 'shareable-37f85.firebaseapp.com',
  projectId: 'shareable-37f85',
  storageBucket: 'shareable-37f85.appspot.com',
  messagingSenderId: '542630327474',
  appId: '1:542630327474:web:8258d25c6c24e0384185ab',
  measurementId: 'G-C3YDL8XPHE',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById('login').addEventListener('click', function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      var cur = auth.currentUser;
      console.log(cur.id);
      alert('Login successful!');
      console.log(cur);
      window.location.href = 'home.html';

    })
    .catch((error) => {
      console.error(error);
      alert(`Login failed! Error: ${error.message}`);
    });
});

onAuthStateChanged(auth, (user) => {
  if (user) {
  }
});
