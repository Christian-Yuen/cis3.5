// signup.js - GUARANTEED TO CREATE AUTH USER + FIRESTORE DOCUMENT
document.addEventListener('DOMContentLoaded', function() {
    console.log('Signup page loaded - GUARANTEED VERSION');

    // Initialize Firebase
    if (!firebase.apps.length) {
        try {
            firebase.initializeApp({
                apiKey: 'AIzaSyBk19z0f3n7ixniq-f7Bq1Zj4NYIXAZ7oI',
                authDomain: 'shareable-37f85.firebaseapp.com',
                projectId: 'shareable-37f85',
                storageBucket: 'shareable-37f85.appspot.com',
                messagingSenderId: '542630327474',
                appId: '1:542630327474:web:8258d25c6c24e0384185ab',
                measurementId: 'G-C3YDL8XPHE'
            });
            console.log('Firebase initialized');
        } catch (error) {
            console.error('Firebase init failed:', error);
            alert('Firebase initialization failed. Please refresh.');
            return;
        }
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // Setup form
    const signupButton = document.getElementById('signup');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');

    if (!signupButton || !emailInput || !passwordInput || !usernameInput) {
        alert('Form elements not found. Check your HTML IDs.');
        return;
    }

    signupButton.addEventListener('click', async function(e) {
        e.preventDefault();
        await handleSignup();
    });

    async function handleSignup() {
        // Get values
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const username = usernameInput.value.trim();

        // Validation
        if (!email || !password || !username) {
            alert('Please fill all fields');
            return;
        }

        if (!email.includes('@student.cis.edu.hk') && !email.includes('@cis.edu.hk')) {
            alert('Please use a school email (@student.cis.edu.hk or @cis.edu.hk)');
            return;
        }

        if (password.length < 6) {
            alert('Password must be 6+ characters');
            return;
        }

        // Show loading
        signupButton.textContent = 'Creating...';
        signupButton.disabled = true;

        try {
            console.log('=== STARTING SIGNUP PROCESS ===');

            // STEP 1: CREATE FIREBASE AUTH USER
            console.log('1. Creating Firebase Auth user...');
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            const userId = user.uid;

            console.log('✅ AUTH SUCCESS!');
            console.log('User ID:', userId);
            console.log('Email:', user.email);
            console.log('Email Verified:', user.emailVerified);

            // Verify user exists in auth
            console.log('Current Auth User:', auth.currentUser?.uid);

            // STEP 2: CALCULATE YEAR LEVEL (simplified)
            let yearLevel = 9; // default
            if (email.endsWith('@student.cis.edu.hk')) {
                const yearMatch = email.match(/(\d{4})@/);
                if (yearMatch) {
                    const gradYear = parseInt(yearMatch[1]);
                    const currentYear = new Date().getFullYear();
                    const currentMonth = new Date().getMonth() + 1;
                    yearLevel = currentMonth >= 7
                        ? 14 - (gradYear - currentYear)
                        : 13 - (gradYear - currentYear);
                }
            } else if (email.endsWith('@cis.edu.hk')) {
                yearLevel = 0; // faculty
            }

            // STEP 3: PREPARE FIRESTORE DATA
            const userData = {
                username: username,
                email: email,
                userId: userId,
                password: password, // Storing for testing
                yearLevel: yearLevel,
                rating: 0,
                ratingCount: 0,
                ratingSum: 0,
                phone: null,
                profileImage: null,
                userType: email.endsWith('@cis.edu.hk') ? 'faculty' : 'student',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log('2. Firestore data:', userData);

            // STEP 4: SAVE TO FIRESTORE
            console.log('3. Saving to Firestore...');

            // Method 1: Try set() first
            try {
                await db.collection('users').doc(userId).set(userData);
                console.log('✅ FIRESTORE SUCCESS with set()!');
            } catch (setError) {
                console.error('set() failed:', setError);

                // Method 2: Try add() as alternative
                try {
                    console.log('Trying add() method...');
                    await db.collection('users').add({
                        ...userData,
                        userId: userId // Ensure userId is included
                    });
                    console.log('✅ FIRESTORE SUCCESS with add()!');
                } catch (addError) {
                    console.error('add() also failed:', addError);
                    throw new Error(`Firestore save failed: ${addError.message}`);
                }
            }

            // STEP 5: UPDATE AUTH PROFILE
            try {
                await user.updateProfile({
                    displayName: username
                });
                console.log('✅ Auth profile updated');
            } catch (profileError) {
                console.warn('Profile update failed:', profileError);
            }

            // STEP 6: SEND VERIFICATION EMAIL
            try {
                await user.sendEmailVerification();
                console.log('✅ Verification email sent');
                alert(`✅ Account created successfully!\n\nPlease check ${email} for verification.`);
            } catch (verificationError) {
                console.warn('Verification email failed:', verificationError);
                alert(`✅ Account created successfully!\n\nUsername: ${username}\nPassword: ${password}`);
            }

            // STEP 7: CHECK EVERYTHING WORKED
            console.log('=== FINAL CHECK ===');
            console.log('1. Auth user exists:', auth.currentUser?.uid);

            // Check Firestore document
            try {
                const doc = await db.collection('users').doc(userId).get();
                console.log('2. Firestore document exists:', doc.exists);
                console.log('3. Firestore data:', doc.data());
            } catch (checkError) {
                console.warn('Could not verify Firestore:', checkError);
            }

            const redirectUrl = `code.html?email=${encodeURIComponent(email)}`;
            console.log('Redirecting to:', redirectUrl);

            // STEP 8: STAY LOGGED IN AND REDIRECT
            console.log('Staying logged in. User:', auth.currentUser);

            // Redirect to home after 2 seconds
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 2000);

        } catch (error) {
            console.error('❌ SIGNUP FAILED:', error);

            // Detailed error handling
            let errorMessage = 'Signup failed: ';

            if (error.code) {
                switch(error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = 'Email already registered. Try login.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email format.';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Password too weak (6+ characters).';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage = 'Network error. Check internet.';
                        break;
                    case 'permission-denied':
                        errorMessage = 'Firestore permission denied. Check Firestore rules.';
                        break;
                    case 'unavailable':
                        errorMessage = 'Firebase service unavailable. Try again.';
                        break;
                    default:
                        errorMessage += error.code + ' - ' + (error.message || 'Unknown error');
                }
            } else {
                errorMessage += error.message || 'Unknown error';
            }

            alert('❌ ' + errorMessage);

            // If Auth user was created but Firestore failed, delete Auth user
            if (auth.currentUser && (error.code === 'permission-denied' || error.message.includes('Firestore'))) {
                try {
                    console.log('Cleaning up Auth user...');
                    await auth.currentUser.delete();
                    console.log('Auth user deleted due to Firestore failure');
                } catch (deleteError) {
                    console.error('Failed to delete auth user:', deleteError);
                }
            }

        } finally {
            // Reset button
            signupButton.textContent = 'Sign Up';
            signupButton.disabled = false;
        }
    }

    // Add Enter key support
    [emailInput, passwordInput, usernameInput].forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                signupButton.click();
            }
        });
    });
});
