document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile page loaded');

    if (typeof firebase === 'undefined') {
        console.error('Firebase is not loaded');
        showErrorMessage('Firebase not loaded. Please check script imports.');
        return;
    }

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
            console.error('Firebase init error:', error);
            showErrorMessage('Failed to initialize Firebase.');
            return;
        }
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage ? firebase.storage() : null;

    if (db.settings) {
        try {
            db.settings({
                cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
                experimentalForceLongPolling: true,
                merge: true
            });
            console.log('Firestore configured for Cordova');
        } catch (e) {
            console.log('Could not configure Firestore settings:', e);
        }
    }

    let currentUserId = null;
    let currentUserEmail = null;
    let currentUsername = null;

    // Logout handler
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(event) {
            event.preventDefault();
            handleLogout();
        });
    }

    // Authentication state
    auth.onAuthStateChanged(function(user) {
        if (!user) {
            console.log('No user logged in, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        currentUserId = user.uid;
        currentUserEmail = user.email;
        console.log('User logged in:', user.email);

        // Load user profile FIRST
        loadUserProfile(currentUserId)
            .then(function() {
                loadUserDonations(currentUserId);
                loadUserReservations(currentUserId);
            })
            .catch(function(error) {
                console.error('Error loading profile:', error);
            });
    });

    function handleLogout() {
        auth.signOut()
            .then(function() {
                console.log('User logged out');
                window.location.href = 'login.html';
            })
            .catch(function(error) {
                console.error('Error signing out:', error);
                alert('Error logging out. Please try again.');
            });
    }

    async function loadUserProfile(userId) {
        console.log('Loading profile for user:', userId);

        try {
            const docSnapshot = await db.collection('users').doc(userId).get();

            if (!docSnapshot.exists) {
                console.error('User document not found');
                showErrorMessage('User profile not found.');
                return;
            }

            const data = docSnapshot.data();
            console.log('User data loaded:', data);

            // Update profile elements
            const nameElement = document.getElementById('name');
            const profileImageElement = document.getElementById('profile-image');
            const emailElement = document.getElementById('email');
            const ratingElement = document.getElementById('rating');
            const ratingCountElement = document.getElementById('rating-count');

            if (emailElement) {
                emailElement.textContent = data.email || currentUserEmail || 'No email';
                currentUserEmail = data.email || currentUserEmail;
            }

            if (nameElement) {
                nameElement.textContent = data.username || 'No name';
                currentUsername = data.username;
            }

            if (ratingElement) {
                ratingElement.textContent = "Overall rating: " + (data.rating || '0');
            }

            if (ratingCountElement) {
                ratingCountElement.textContent = "Rated " + (data.ratingCount || '0') + " times";
            }

            // Load profile image if available
            if (profileImageElement) {
                if (data.profileImageUrl && storage) {
                    try {
                        const url = await getImageUrl(data.profileImageUrl);
                        profileImageElement.src = url;
                    } catch (error) {
                        console.error('Error loading profile image:', error);
                        profileImageElement.src = 'images/default-profile.png';
                    }
                } else {
                    profileImageElement.src = 'images/default-profile.png';
                }
            }

            console.log('Profile loaded successfully');

        } catch (error) {
            console.error('Error loading user profile:', error);
            showErrorMessage('Error loading profile data.');
        }
    }

    async function getImageUrl(imageUrl) {
        if (!imageUrl || !storage) return null;

        try {
            // If it's a Firebase Storage URL
            if (imageUrl.includes('firebasestorage.googleapis.com')) {
                // Try to get download URL directly
                const storageRef = storage.refFromURL(imageUrl);
                return await storageRef.getDownloadURL();
            }

            // If it's a direct path
            if (imageUrl.startsWith('profile/') || imageUrl.startsWith('items/')) {
                const storageRef = storage.ref(imageUrl);
                return await storageRef.getDownloadURL();
            }

            return imageUrl;

        } catch (error) {
            console.error('Error getting image URL:', error);
            throw error;
        }
    }

    function loadUserDonations(userId) {
        console.log('Loading donations for user:', userId);
        const itemList = document.getElementById('listing-content');

        if (!itemList) {
            console.error('Donations container not found');
            return;
        }

        // Show loading
        itemList.innerHTML = '<div style="color: #666; font-size: 16px; text-align: center; padding: 40px;">Loading donations...</div>';

        // Try indexed query first
        db.collection('items')
            .where('userId', '==', userId)
            .where('closed', '==', false)
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get()
            .then(function(querySnapshot) {
                console.log('Donations loaded:', querySnapshot.size, 'items');

                itemList.innerHTML = '';

                if (querySnapshot.empty) {
                    itemList.innerHTML = `
                        <div style="color: #666; font-size: 16px; text-align: center; padding: 40px;">
                            No active donations found.
                        </div>
                    `;
                    return;
                }

                let items = [];
                querySnapshot.forEach(function(doc) {
                    const data = doc.data();
                    data.id = doc.id;
                    items.push(data);
                });

                // Load items with images
                loadItemsWithImages(items, itemList, false);

            })
            .catch(function(error) {
                console.error('Error loading donations:', error);

                // Fallback: Try without ordering if index error
                if (error.code === 'failed-precondition') {
                    console.log('Using fallback for donations...');
                    loadUserDonationsFallback(userId);
                } else {
                    itemList.innerHTML = `
                        <div style="color: #FF6B6B; font-size: 16px; text-align: center; padding: 40px;">
                            Error loading donations: ${error.message}
                        </div>
                    `;
                }
            });
    }

    function loadUserReservations(userId) {
        console.log('Loading reservations for user:', userId);
        const itemList = document.getElementById('reservations-content');

        if (!itemList) {
            console.error('Reservations container not found');
            return;
        }

        itemList.innerHTML = '<div style="color: #666; font-size: 16px; text-align: center; padding: 40px;">Loading reservations...</div>';

        // Try indexed query first
        db.collection('items')
            .where('reserved', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get()
            .then(function(querySnapshot) {
                console.log('Reservations loaded:', querySnapshot.size, 'items');

                itemList.innerHTML = '';

                if (querySnapshot.empty) {
                    itemList.innerHTML = `
                        <div style="color: #666; font-size: 16px; text-align: center; padding: 40px;">
                            No reservations found.
                        </div>
                    `;
                    return;
                }

                let items = [];
                querySnapshot.forEach(function(doc) {
                    const data = doc.data();
                    data.id = doc.id;
                    items.push(data);
                });

                loadItemsWithImages(items, itemList, true);

            })
            .catch(function(error) {
                console.error('Error loading reservations:', error);

                if (error.code === 'failed-precondition') {
                    console.log('Using fallback for reservations...');
                    loadUserReservationsFallback(userId);
                } else {
                    itemList.innerHTML = `
                        <div style="color: #FF6B6B; font-size: 16px; text-align: center; padding: 40px;">
                            Error loading reservations: ${error.message}
                        </div>
                    `;
                }
            });
    }

    // Fallback functions (without ordering)
    function loadUserDonationsFallback(userId) {
        const itemList = document.getElementById('listing-content');
        if (!itemList) return;

        db.collection('items')
            .where('userId', '==', userId)
            .get()
            .then(function(querySnapshot) {
                let items = [];
                querySnapshot.forEach(function(doc) {
                    const data = doc.data();
                    data.id = doc.id;
                    if (!data.closed) {
                        items.push(data);
                    }
                });

                items.sort((a, b) => {
                    const timeA = a.timestamp?.toMillis?.() || 0;
                    const timeB = b.timestamp?.toMillis?.() || 0;
                    return timeB - timeA;
                });

                items = items.slice(0, 20);

                if (items.length === 0) {
                    itemList.innerHTML = `
                        <div style="color: #666; font-size: 16px; text-align: center; padding: 40px;">
                            No active donations found.
                        </div>
                    `;
                    return;
                }

                loadItemsWithImages(items, itemList, false);
            });
    }

    function loadUserReservationsFallback(userId) {
        const itemList = document.getElementById('reservations-content');
        if (!itemList) return;

        db.collection('items')
            .where('reserved', '==', userId)
            .get()
            .then(function(querySnapshot) {
                let items = [];
                querySnapshot.forEach(function(doc) {
                    const data = doc.data();
                    data.id = doc.id;
                    items.push(data);
                });

                items.sort((a, b) => {
                    const timeA = a.timestamp?.toMillis?.() || 0;
                    const timeB = b.timestamp?.toMillis?.() || 0;
                    return timeB - timeA;
                });

                items = items.slice(0, 20);

                if (items.length === 0) {
                    itemList.innerHTML = `
                        <div style="color: #666; font-size: 16px; text-align: center; padding: 40px;">
                            No reservations found.
                        </div>
                    `;
                    return;
                }

                loadItemsWithImages(items, itemList, true);
            });
    }

    async function loadItemsWithImages(items, container, isReservation) {
        container.innerHTML = '';

        for (let i = 0; i < items.length; i++) {
            const data = items[i];
            let imageUrl = null;

            // Try to get image URL
            if (data.itemImageUrl) {
                try {
                    imageUrl = await getImageUrl(data.itemImageUrl);
                } catch (error) {
                    console.error('Error loading image for item', data.id, ':', error);
                }
            }

            const itemElement = createItemElement(data, i, imageUrl, isReservation);
            container.appendChild(itemElement);
        }

        // Update container height
        updateContainerHeight(container, items.length);
    }

    function createItemElement(data, index, imageUrl, isReservation) {
        const div = document.createElement('div');

        // Escape HTML
        const name = escapeHtml(data.name || 'No Name');
        const quantity = escapeHtml(data.quantity || '');
        const time = escapeHtml(data.time || '');

        // Image HTML
        const imageDiv = imageUrl ?
            `<div style="width: 50px; height: 50px; background-image: url('${imageUrl}'); background-size: cover; background-position: center; border-radius: 8px;"></div>` :
            `<div style="width: 50px; height: 50px; background: #F6F6F6; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <div style="color: #999; font-size: 12px;">No Image</div>
            </div>`;

        const closedText = data.closed && isReservation ?
            `<div style="width: 269px; right: -95px; top: 27px; position: absolute; color: red; font-size: 14px; font-family: Inter; font-weight: 500; word-wrap: break-word">This item is closed</div>` : '';

        div.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 10vh;">
                <div style="width: 80%;">
                    <div style="height: 77px; position: relative;">
                        <div style="width: 80%; height: 50px; padding-bottom: 10px; position: absolute; left: 15%; transform: translateX(-35%);">
                            <div style="width: 343px; height: 77px; left: 0; top: 20px; position: relative">
                                <a href="product_info.html?itemId=${data.id}" style="width: 400px; height: 50px; padding-bottom: 25px; left: 0px; top: ${Math.floor(index)}px; position: absolute; text-decoration: none; color: inherit;">
                                    ${imageDiv}
                                    <div style="left: 66px; top: 0px; position: absolute; color: black; font-size: 16px; font-family: Inter; font-weight: 700; word-wrap: break-word">${name}</div>
                                    <div style="right: 13%; top: 2px; position: absolute; text-align: right; color: #BDBDBD; font-size: 14px; font-family: Inter; font-weight: 400; word-wrap: break-word">${time}</div>
                                    <div style="width: 269px; left: 66px; top: 27px; position: absolute; color: black; font-size: 14px; font-family: Inter; font-weight: 400; word-wrap: break-word">${quantity}</div>
                                    ${closedText}
                                    <div style="width: 277px; height: 0px; left: 66px; top: 65px; position: absolute; border: 1px #E8E8E8 solid"></div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return div;
    }

    function updateContainerHeight(container, itemCount) {
        if (!container || itemCount === 0) return;

        const rows = Math.ceil(itemCount);
        const newHeight = rows * 100 + 200;
        container.style.minHeight = `${newHeight}px`;
    }

    function showErrorMessage(message) {
        console.error('Error:', message);

        const errorContainer = document.getElementById('error-message') || document.body;
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            right: 10px;
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 5px;
            font-family: Inter, sans-serif;
            font-size: 14px;
            z-index: 10000;
            text-align: center;
        `;
        errorDiv.textContent = message;
        errorContainer.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Logout button
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
});
