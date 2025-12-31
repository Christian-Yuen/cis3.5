document.addEventListener('DOMContentLoaded', function() {
    console.log('Login page loaded');

    // Firebase configuration
    const firebaseConfig = {
        apiKey: 'AIzaSyBk19z0f3n7ixniq-f7Bq1Zj4NYIXAZ7oI',
        authDomain: 'shareable-37f85.firebaseapp.com',
        projectId: 'shareable-37f85',
        storageBucket: 'shareable-37f85.appspot.com',
        messagingSenderId: '542630327474',
        appId: '1:542630327474:web:8258d25c6c24e0384185ab',
        measurementId: 'G-C3YDL8XPHE'
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('Firebase initialized');
    }

    const auth = firebase.auth();

    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log('User already logged in, redirecting...');
            window.location.href = 'home.html';
        }
    });

    // Handle login button click
    const loginButton = document.getElementById('login');
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                alert('Please enter email and password');
                return;
            }

            console.log('Attempting login...');

            auth.signInWithEmailAndPassword(email, password)
                .then(function(userCredential) {
                    console.log('Login successful!');
                    alert('Login successful!');
                    window.location.href = 'home.html';
                })
                .catch(function(error) {
                    console.error('Login error:', error);
                    alert('Login failed: ' + error.message);
                });
        });
    }
});
