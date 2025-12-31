// edit_profile.js - Firebase v8 (compat) version - FIXED
document.addEventListener('DOMContentLoaded', function() {
    console.log('Edit profile page loaded');

    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded!');
        alert('Firebase not loaded. Please refresh or check script tags.');
        return;
    }

    if (!firebase.apps.length) {
        const firebaseConfig = {
            apiKey: 'AIzaSyBk19z0f3n7ixniq-f7Bq1Zj4NYIXAZ7oI',
            authDomain: 'shareable-37f85.firebaseapp.com',
            projectId: 'shareable-37f85',
            storageBucket: 'shareable-37f85.appspot.com',
            messagingSenderId: '542630327474',
            appId: '1:542630327474:web:8258d25c6c24e0384185ab',
            measurementId: 'G-C3YDL8XPHE'
        };
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    // Configure Firestore for Cordova
    if (db.settings) {
        try {
            db.settings({
                experimentalForceLongPolling: true,
                cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
            });
        } catch (e) {
            console.log('Firestore settings already configured');
        }
    }

    let currentUserId = null;
    let currentUserEmail = null;

    // Check authentication and load user data
    auth.onAuthStateChanged(function(user) {
        if (!user) {
            console.log('No user logged in, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        currentUserId = user.uid;
        currentUserEmail = user.email;
        console.log('User logged in:', user.email);

        loadUserData(currentUserId);

        const editButton = document.getElementById('edit');
        if (editButton) {
            editButton.addEventListener('click', function(event) {
                event.preventDefault();
                handleEditProfile();
            });
        } else {
            console.error('Edit button not found');
        }
    });

    function loadUserData(userId) {
        console.log('Loading user data for:', userId);

        const userRef = db.collection('users').doc(userId);

        userRef.get()
            .then(function(docSnapshot) {
                if (docSnapshot.exists) {
                    const data = docSnapshot.data();
                    console.log('User data loaded:', data);

                    // Populate form fields
                    const nameElement = document.getElementById('username');
                    const phoneElement = document.getElementById('phone');
                    const profileImageElement = document.getElementById('profile-image');
                    const emailElement = document.getElementById('email');

                    if (emailElement) emailElement.value = data.email || currentUserEmail || '';
                    if (nameElement) nameElement.value = data.username || '';
                    if (phoneElement) phoneElement.value = data.phone || '';

                    // Load profile image
                    loadProfileImage(data, profileImageElement);

                } else {
                    console.log('No user document found, creating one...');
                    // Create basic user document if it doesn't exist
                    createUserDocument(userId);
                }
            })
            .catch(function(error) {
                console.error('Error fetching user data:', error);
                alert('Error loading profile. Please try again.');
            });
    }

    function createUserDocument(userId) {
        const userData = {
            username: 'User' + userId.substring(0, 4),
            email: currentUserEmail,
            userId: userId,
            phone: '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('users').doc(userId).set(userData)
            .then(() => {
                console.log('User document created');
                loadUserData(userId);
            })
            .catch(error => {
                console.error('Error creating user document:', error);
            });
    }

    function loadProfileImage(data, profileImageElement) {
        if (!profileImageElement) return;

        // Check for profile image in different possible fields
        const imageUrl = data.profileImageUrl || data.profileImage || data.imageURL;

        if (imageUrl) {
            if (imageUrl.includes('firebasestorage.googleapis.com')) {
                try {
                    // Try to use the URL directly
                    profileImageElement.src = imageUrl;
                    profileImageElement.onerror = function() {
                        // If direct URL fails, try to get fresh URL
                        const storageRef = firebase.storage().refFromURL(imageUrl);
                        storageRef.getDownloadURL()
                            .then(url => {
                                profileImageElement.src = url;
                            })
                            .catch(() => {
                                profileImageElement.src = 'images/user.png';
                            });
                    };
                } catch (error) {
                    console.error('Error parsing storage URL:', error);
                    profileImageElement.src = 'images/user.png';
                }
            } else {
                profileImageElement.src = imageUrl;
            }
        } else {
            // Try to load from default storage path
            const defaultImageRef = storage.ref('profile/' + currentUserId + '.png');
            defaultImageRef.getDownloadURL()
                .then(url => {
                    profileImageElement.src = url;
                })
                .catch(error => {
                    console.log('No custom profile image, using default');
                    profileImageElement.src = 'images/user.png';
                });
        }
    }

    function handleEditProfile() {
        const username = document.getElementById('username').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const imageInput = document.getElementById('input-image');

        if (!username) {
            alert('Please enter a username');
            return;
        }

        editProfile(username, phone, imageInput);
    }

    async function editProfile(username, phone, imageInput) {
        console.log('Starting profile update...');

        const editButton = document.getElementById('edit');
        const originalText = editButton.textContent;
        editButton.textContent = 'Saving...';
        editButton.disabled = true;

        try {
            // Prepare update data
            const updateData = {
                username: username,
                phone: phone,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Handle image upload if a file is selected
            if (imageInput && imageInput.files.length > 0) {
                const imageFile = imageInput.files[0];
                const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

                if (!allowedTypes.includes(imageFile.type)) {
                    throw new Error('Please upload a PNG, JPG, or JPEG image.');
                }

                // Validate file size (max 5MB)
                if (imageFile.size > 5 * 1024 * 1024) {
                    throw new Error('Image size should be less than 5MB');
                }

                console.log('Uploading profile image...');

                // Generate unique filename
                const fileExtension = imageFile.name.split('.').pop().toLowerCase();
                const filename = `profile_${currentUserId}_${Date.now()}.${fileExtension}`;
                const storagePath = `profile/${filename}`;
                const storageRef = storage.ref(storagePath);

                // Upload image
                const uploadTask = storageRef.put(imageFile, {
                    contentType: imageFile.type,
                    customMetadata: {
                        uploadedBy: currentUserId,
                        uploadTime: new Date().toISOString()
                    }
                });

                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        snapshot => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            console.log(`Upload progress: ${progress.toFixed(1)}%`);
                        },
                        error => reject(error),
                        () => resolve()
                    );
                });

                // Get download URL
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                console.log('Image uploaded, URL:', downloadURL);

                // Add to update data
                updateData.profileImageUrl = downloadURL;
                updateData.profileImage = downloadURL; // Add both fields for compatibility
            }

            // Update Firestore
            console.log('Updating Firestore with:', updateData);
            await db.collection('users').doc(currentUserId).update(updateData);

            // Update the displayed image if a new one was uploaded
            if (updateData.profileImageUrl) {
                const profileImageElement = document.getElementById('profile-image');
                if (profileImageElement) {
                    profileImageElement.src = updateData.profileImageUrl;
                }
            }

            alert('✅ Profile updated successfully!');

            try {
                await auth.currentUser.updateProfile({
                    displayName: username
                });
                console.log('Auth profile name updated');
            } catch (authError) {
                console.warn('Could not update auth profile:', authError);
            }

        } catch (error) {
            console.error('Error updating profile:', error);
            alert(`❌ Error: ${error.message}`);

        } finally {
            editButton.textContent = originalText;
            editButton.disabled = false;
        }
    }

    // Add profile image preview functionality
    const imageInput = document.getElementById('input-image');
    const profileImage = document.getElementById('profile-image');

    if (imageInput && profileImage) {
        imageInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();

                reader.onload = function(e) {
                    profileImage.src = e.target.result;
                };

                reader.onerror = function(error) {
                    console.error('Error reading image file:', error);
                    alert('Error reading image file');
                };

                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    window.loadUserData = loadUserData;
    window.editProfile = editProfile;
});
