document.addEventListener('DOMContentLoaded', function() {
    console.log('User profile page loaded');

    // Initialize Firebase if not already initialized
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

    // Get query parameters
    function getQueryParams() {
        var queryParams = {};
        var search = window.location.search.substring(1);
        if (search) {
            search.split('&').forEach(function(paramPair) {
                const pair = paramPair.split('=');
                if (pair.length === 2) {
                    queryParams[pair[0]] = decodeURIComponent(pair[1]);
                }
            });
        }
        return queryParams;
    }

    var params = getQueryParams();
    var userId = params.userId;
    var itemId = params.itemId;

    // Add event listener to the back link
    var backLink = document.getElementById('backLink');
    if (backLink) {
        backLink.addEventListener('click', function(event) {
            event.preventDefault();
            if (itemId) {
                window.location.href = 'product_info.html?itemId=' + itemId;
            } else {
                window.location.href = 'result.html?category=Users';
            }
        });
    }

    // Check authentication
    auth.onAuthStateChanged(function(user) {
        if (!user) {
            console.log('No user logged in, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        console.log('User is logged in:', user.uid);
        loadProfileData(user.uid);
    });

    function loadProfileData(currentUserId) {
        if (!userId) {
            console.error('No userId in query parameters');
            return;
        }

        // Load user information
        db.collection('users').doc(userId).get()
            .then(function(docSnapshot) {
                if (docSnapshot.exists) {
                    var data = docSnapshot.data();
                    var nameElement = document.getElementById('name');
                    var profileImageElement = document.getElementById('profile-image');
                    var emailElement = document.getElementById('email');
                    var ratingElement = document.getElementById('rating');
                    var ratingCountElement = document.getElementById('rating-count');

                    if (emailElement) emailElement.textContent = data.email || 'No email';
                    if (nameElement) nameElement.textContent = data.username || 'No name';
                    if (ratingElement) ratingElement.textContent = "Overall rating: " + (data.rating || '0');
                    if (ratingCountElement) ratingCountElement.textContent = "Rated " + (data.ratingCount || '0') + " times";

                    // Load profile image
                    var userStorageRef = storage.ref('profile/' + userId + '.png');
                    userStorageRef.getDownloadURL()
                        .then(function(url) {
                            if (profileImageElement) profileImageElement.src = url;
                        })
                        .catch(function(error) {
                            console.error('Error retrieving profile image URL:', error);
                            // Use default image if profile image doesn't exist
                            if (profileImageElement) {
                                profileImageElement.src = 'images/default-profile.png';
                            }
                        });
                } else {
                    console.error('User document not found');
                }
            })
            .catch(function(error) {
                console.error('Error fetching user data:', error);
            });

        // Load user's donations listing
        loadUserDonations();

        // Load user's reservations listing
        loadUserReservations();
    }

    function loadUserDonations() {
        console.log('Loading user donations...');

        db.collection('items').get()
            .then(function(querySnapshot) {
                var itemList = document.getElementById('listing-content');
                if (!itemList) {
                    console.error('Donations container not found');
                    return;
                }

                var i = 0;
                querySnapshot.forEach(function(doc) {
                    var data = doc.data();
                    data.id = doc.id;

                    if (data.userId === userId) {
                        var imageURL = data.imageURL || data.itemImageUrl || data.imageUrl;

                        if (imageURL) {
                            var filename = extractFilenameFromURL(imageURL);
                            var imageRef = storage.ref(filename);

                            imageRef.getDownloadURL()
                                .then(function(url) {
                                    createDonationItem(data, itemList, i, url);
                                    i++;
                                })
                                .catch(function(error) {
                                    console.error('Error getting download URL from storage:', error);
                                    // Try to use the URL directly if it's already a download URL
                                    if (imageURL.startsWith('https://')) {
                                        createDonationItem(data, itemList, i, imageURL);
                                    } else {
                                        createDonationItem(data, itemList, i, null);
                                    }
                                    i++;
                                });
                        } else {
                            // No image URL found
                            createDonationItem(data, itemList, i, null);
                            i++;
                        }
                    }
                });

                // If no items found
                if (i === 0) {
                    itemList.innerHTML += `
                        <div style="color: #666; font-size: 16px; text-align: center; padding: 40px;">
                            No donations found for this user.
                        </div>`;
                }
            })
            .catch(function(error) {
                console.error('Error getting documents: ', error);
                var itemList = document.getElementById('listing-content');
                if (itemList) {
                    itemList.innerHTML += `
                        <div style="color: #FF6B6B; font-size: 16px; text-align: center; padding: 40px;">
                            Error loading donations. Please try again.
                        </div>`;
                }
            });
    }

    function loadUserReservations() {
        console.log('Loading user reservations...');

        db.collection('items').get()
            .then(function(querySnapshot) {
                var itemList = document.getElementById('reservations-content');
                if (!itemList) {
                    console.error('Reservations container not found');
                    return;
                }

                var i = 0;
                querySnapshot.forEach(function(doc) {
                    var data = doc.data();
                    data.id = doc.id;

                    if (data.reserved === userId) {
                        var imageURL = data.imageURL || data.itemImageUrl || data.imageUrl;

                        if (imageURL) {
                            var filename = extractFilenameFromURL(imageURL);
                            var imageRef = storage.ref(filename);

                            imageRef.getDownloadURL()
                                .then(function(url) {
                                    createReservationItem(data, itemList, i, url);
                                    i++;
                                })
                                .catch(function(error) {
                                    console.error('Error getting download URL from storage:', error);
                                    if (imageURL.startsWith('https://')) {
                                        createReservationItem(data, itemList, i, imageURL);
                                    } else {
                                        createReservationItem(data, itemList, i, null);
                                    }
                                    i++;
                                });
                        } else {
                            createReservationItem(data, itemList, i, null);
                            i++;
                        }
                    }
                });

                if (i === 0) {
                    itemList.innerHTML += `
                        <div style="color: #666; font-size: 16px; text-align: center; padding: 40px;">
                            No reservations found for this user.
                        </div>`;
                }
            })
            .catch(function(error) {
                console.error('Error getting documents: ', error);
                var itemList = document.getElementById('reservations-content');
                if (itemList) {
                    itemList.innerHTML += `
                        <div style="color: #FF6B6B; font-size: 16px; text-align: center; padding: 40px;">
                            Error loading reservations. Please try again.
                        </div>`;
                }
            });
    }

    // Helper function to extract filename from URL
    function extractFilenameFromURL(url) {
        try {
            if (!url.includes('/')) {
                return url;
            }

            // Try to parse as URL
            var urlObj = new URL(url);
            var pathname = urlObj.pathname;
            var filename = pathname.split('/').pop().split('?')[0].split('#')[0];

            // If the filename has %20 or other encoded characters, decode them
            filename = decodeURIComponent(filename);

            return filename;
        } catch (e) {
            console.log('URL parsing failed, trying manual extraction:', e);

            var cleanUrl = url.split('?')[0].split('#')[0];

            var lastSlashIndex = cleanUrl.lastIndexOf('/');
            if (lastSlashIndex !== -1) {
                var filename = cleanUrl.substring(lastSlashIndex + 1);
                // Decode URL encoded characters
                try {
                    filename = decodeURIComponent(filename);
                } catch (decodeError) {
                    console.log('Failed to decode filename:', decodeError);
                }
                return filename;
            }

            return url;
        }
    }

    function createDonationItem(data, container, index, imageUrl) {
        var div = document.createElement('div');
        var imageDiv = imageUrl ?
            `<div style="width: 50px; height: 50px; background-image: url('${imageUrl}'); background-size: cover; background-position: center center; border-radius: 8px;"></div>` :
            '<div style="width: 50px; height: 50px; background: #F6F6F6; border-radius: 8px; display: flex; align-items: center; justify-content: center;"><div style="color: #999; font-size: 12px;">No Image</div></div>';

        div.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 10vh;">
                <div style="width: 80%;">
                    <div style="height: 77px; position: relative;">
                        <div style="width: 80%; height: 50px; padding-bottom: 10px; position: absolute; left: 15%; transform: translateX(-35%);">
                            <div style="width: 343px; height: 77px; left: 0; top: 20px; position: relative">
                                <a href="product_info.html?itemId=${data.id}" style="width: 400px; height: 50px; padding-bottom: 25px; left: 0px; top: ${Math.floor(index)}px; position: absolute;">
                                    ${imageDiv}
                                    <div style="left: 66px; top: 0px; position: absolute; color: black; font-size: 16px; font-family: Inter; font-weight: 700; word-wrap: break-word">${data.name || 'No Name'}</div>
                                    <div style="right: 13%; top: 2px; position: absolute; text-align: right; color: #BDBDBD; font-size: 14px; font-family: Inter; font-weight: 400; word-wrap: break-word">${data.time || ''}</div>
                                    <div style="width: 269px; left: 66px; top: 27px; position: absolute; color: black; font-size: 14px; font-family: Inter; font-weight: 400; word-wrap: break-word">${data.quantity || ''}</div>
                                    <div style="width: 277px; height: 0px; left: 66px; top: 65px; position: absolute; border: 1px #E8E8E8 solid"></div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        container.appendChild(div);
    }

    function createReservationItem(data, container, index, imageUrl) {
        var div = document.createElement('div');
        var imageDiv = imageUrl ?
            `<div style="width: 50px; height: 50px; background-image: url('${imageUrl}'); background-size: cover; background-position: center center; border-radius: 8px;"></div>` :
            '<div style="width: 50px; height: 50px; background: #F6F6F6; border-radius: 8px; display: flex; align-items: center; justify-content: center;"><div style="color: #999; font-size: 12px;">No Image</div></div>';

        var closedText = data.closed ? '<div style="width: 269px; right: -95px; top: 27px; position: absolute; color: red; font-size: 14px; font-family: Inter; font-weight: 500; word-wrap: break-word">This item is closed</div>' : '';

        div.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 10vh;">
                <div style="width: 80%;">
                    <div style="height: 77px; position: relative;">
                        <div style="width: 80%; height: 50px; padding-bottom: 10px; position: absolute; left: 15%; transform: translateX(-35%);">
                            <div style="width: 343px; height: 77px; left: 0; top: 20px; position: relative">
                                <a href="product_info.html?itemId=${data.id}" style="width: 400px; height: 50px; padding-bottom: 25px; left: 0px; top: ${Math.floor(index)}px; position: absolute;">
                                    ${imageDiv}
                                    <div style="left: 66px; top: 0px; position: absolute; color: black; font-size: 16px; font-family: Inter; font-weight: 700; word-wrap: break-word">${data.name || 'No Name'}</div>
                                    <div style="right: 13%; top: 2px; position: absolute; text-align: right; color: #BDBDBD; font-size: 14px; font-family: Inter; font-weight: 400; word-wrap: break-word">${data.time || ''}</div>
                                    <div style="width: 269px; left: 66px; top: 27px; position: absolute; color: black; font-size: 14px; font-family: Inter; font-weight: 400; word-wrap: break-word">${data.quantity || ''}</div>
                                    ${closedText}
                                    <div style="width: 277px; height: 0px; left: 66px; top: 65px; position: absolute; border: 1px #E8E8E8 solid"></div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        container.appendChild(div);
    }
});
