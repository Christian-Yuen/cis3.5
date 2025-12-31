import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-storage.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-app.js';
import { updateDoc } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js';
import { db } from './firebaseConfig.js';

import {
  getAuth, sendPasswordResetEmail, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-auth.js';

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
document.addEventListener('DOMContentLoaded', function () {

  const sendEmailButton = document.getElementById('reset');
  sendEmailButton.addEventListener('click', function() {
    console.log(user.email);
    const email = document.getElementById('email').value;
    if (user !== null && user.email !== email) {
      alert('Incorrect email!');
      return;
    }
    if (email) {
      sendPasswordResetEmail(auth, email)
        .then(() => {
          alert('Password reset email sent!');
        })
        .catch((error) => {
          console.error('Error sending password reset email:', error);
          alert(`Failed to send password reset email: ${error.message}`);
        });
    } else {
      alert('Please enter your email address.');
    }

  });
});
