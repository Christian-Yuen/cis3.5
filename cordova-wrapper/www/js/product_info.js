document.addEventListener('DOMContentLoaded', function() {
    console.log('Product info page loaded');

    // Get query parameters FIRST (before Firebase initialization)
    function getQueryParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');

        for (const pair of pairs) {
            const [key, value] = pair.split('=');
            if (key && value) {
                params[decodeURIComponent(key)] = decodeURIComponent(value);
            }
        }
        return params;
    }

    const params = getQueryParams();
    const itemId = params.itemId;

    if (!itemId) {
        console.error('No itemId in URL');
        alert('Product ID is missing. Redirecting to home.');
        window.location.href = 'home.html';
        return;
    }

    console.log('Loading product with ID:', itemId);

    if (typeof firebase === 'undefined') {
        console.error('Firebase is not loaded');
        alert('Firebase not loaded. Please refresh.');
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
            alert('Failed to initialize Firebase.');
            return;
        }
    }

    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    if (db.settings) {
        try {
            db.settings({
                cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
                experimentalForceLongPolling: true
            });
            console.log('Firestore configured for Cordova');
        } catch (e) {
            console.log('Could not configure Firestore settings:', e);
        }
    }

    let currentUserId = null;
    let currentUserEmail = null;
    let currentUserName = null;

    // Check authentication
    auth.onAuthStateChanged(function(user) {
        if (!user) {
            console.log('No user logged in, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        currentUserId = user.uid;
        currentUserEmail = user.email;
        console.log('User logged in:', user.email);

        // Get user's username
        db.collection('users').doc(currentUserId).get()
            .then(function(userDoc) {
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    currentUserName = userData.username || user.email;
                }
                // Load product info
                loadProductInfo(itemId);
            })
            .catch(function(error) {
                console.error('Error fetching user data:', error);
                loadProductInfo(itemId);
            });
    });

    function loadProductInfo(itemId) {
        console.log('Loading product info...');

        // Create containers if they don't exist
        createContainersIfNeeded();

        // Show loading state
        const infoContainer = document.getElementById('info');
        const buttonContainer = document.getElementById('buttondiv');

        infoContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Loading product information...</div>';
        buttonContainer.innerHTML = '';

        db.collection('items').doc(itemId).get()
            .then(function(doc) {
                if (!doc.exists) {
                    showErrorMessage('Product not found.');
                    return;
                }

                const data = doc.data();
                data.id = doc.id;
                console.log('Product data loaded:', data);

                db.collection('users').doc(data.userId).get()
                    .then(function(userDoc) {
                        const userData = userDoc.exists ? userDoc.data() : {};
                        console.log('Owner data:', userData);
                        displayProductInfo(data, userData);
                    })
                    .catch(function(error) {
                        console.error('Error loading user data:', error);
                        displayProductInfo(data, {});
                    });
            })
            .catch(function(error) {
                console.error('Error loading product:', error);
                showErrorMessage('Failed to load product. Please check your internet connection and try again.');
            });
    }

    function createContainersIfNeeded() {
        // Create info container if it doesn't exist
        if (!document.getElementById('info')) {
            const infoContainer = document.createElement('div');
            infoContainer.id = 'info';
            infoContainer.style.cssText = 'width: 100%; padding: 20px;';

            document.body.insertBefore(infoContainer, document.body.firstChild);
        }

        // Create button container if it doesn't exist
        if (!document.getElementById('buttondiv')) {
            const buttonContainer = document.createElement('div');
            buttonContainer.id = 'buttondiv';
            buttonContainer.style.cssText = 'width: 100%; padding: 20px; text-align: center;';

            // Insert after info container
            const infoContainer = document.getElementById('info');
            if (infoContainer && infoContainer.parentNode) {
                infoContainer.parentNode.insertBefore(buttonContainer, infoContainer.nextSibling);
            } else {
                document.body.appendChild(buttonContainer);
            }
        }
    }

    function displayProductInfo(data, userData) {
        console.log('Displaying product info for:', data.name);

        const infoContainer = document.getElementById('info');
        const buttonContainer = document.getElementById('buttondiv');

        // Clear containers
        infoContainer.innerHTML = '';
        buttonContainer.innerHTML = '';

        // Create product display
        const productHTML = `
            <div style="width: 100%; max-width: 400px; margin: 0 auto; padding: 20px;">
                <!-- Image Container -->
                <div style="width: 100%; height: 250px; background: #f5f5f5; border-radius: 8px; margin-bottom: 20px;
                            display: flex; align-items: center; justify-content: center; overflow: hidden;"
                     id="product-image-container">
                    <span style="color: #999;">Loading image...</span>
                </div>

                <!-- Product Details -->
                <div style="margin-bottom: 15px;">
                    <h2 style="margin: 0 0 10px 0; color: #333; font-family: Inter, sans-serif; font-size: 24px;">
                        ${escapeHtml(data.name || 'Unnamed Item')}
                    </h2>

                    <div style="background: #f0f7e4; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
                        <p style="margin: 0 0 5px 0; color: #333; font-family: Inter, sans-serif;">
                            <strong>Quantity:</strong> ${escapeHtml(data.quantity || 'N/A')}
                        </p>
                        <p style="margin: 0 0 5px 0; color: #333; font-family: Inter, sans-serif;">
                            <strong>Category:</strong> ${escapeHtml(data.category || 'Uncategorized')}
                        </p>
                        <p style="margin: 0 0 5px 0; color: #333; font-family: Inter, sans-serif;">
                            <strong>Uploaded:</strong> ${escapeHtml(data.time || 'Unknown date')}
                        </p>
                    </div>

                    <!-- Owner Info -->
                    <div style="background: #e8f4f8; padding: 10px; border-radius: 8px;">
                        <p style="margin: 0 0 5px 0; color: #333; font-family: Inter, sans-serif;">
                            <strong>Donated by:</strong>
                        </p>
                        <a href="another_profile.html?userId=${data.userId}"
                           style="color: #94BF1A; text-decoration: none; font-weight: 700; font-size: 16px;">
                           <div style="display: flex; align-items: center; padding: 5px;">
                               <div style="width: 30px; height: 30px; background: #94BF1A; border-radius: 50%;
                                          margin-right: 10px; display: flex; align-items: center; justify-content: center;">
                                   <span style="color: white; font-size: 14px;">${(data.username || userData.username || 'U').charAt(0).toUpperCase()}</span>
                               </div>
                               ${escapeHtml(data.username || userData.username || 'Unknown User')}
                           </div>
                        </a>
                    </div>

                    <!-- Status Badge -->
                    <div style="margin-top: 15px; padding: 10px; border-radius: 8px;
                                background: ${getStatusColor(data)}; text-align: center;">
                        <strong style="color: ${getStatusTextColor(data)};">
                            ${getStatusText(data)}
                        </strong>
                    </div>
                </div>
            </div>
        `;

        infoContainer.innerHTML = productHTML;

        // Load product image
        loadProductImage(data);

        // Create action buttons
        createActionButtons(data, buttonContainer);
    }

    function loadProductImage(data) {
        const imageContainer = document.getElementById('product-image-container');
        if (!imageContainer) return;

        //Check for Image URL

        const imageUrl = data.imageURL || data.itemImageUrl;
        if (!imageUrl) {
            imageContainer.innerHTML = `
                <div style="text-align: center; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📦</div>
                    <div>No image available</div>
                </div>
            `;
            return;
        }

        console.log('Loading image from URL:', imageUrl);

        // Create image element
        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';

        // Set loading state
        imageContainer.innerHTML = '';
        imageContainer.appendChild(img);

        // Try to load the image
        img.onload = function() {
            console.log('Image loaded successfully');
        };

        img.onerror = function() {
            console.error('Failed to load image');
            imageContainer.innerHTML = `
                <div style="text-align: center; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                    <div>Failed to load image</div>
                </div>
            `;
        };

        img.src = imageUrl;

        setTimeout(function() {
            if (!img.complete || img.naturalWidth === 0) {
                img.onerror();
            }
        }, 3000);
    }

    function getStatusColor(data) {
        if (data.closed) return '#ffebee';
        if (data.reserved) return '#fff3e0';
        return '#e8f5e9';
    }

    function getStatusTextColor(data) {
        if (data.closed) return '#c62828';
        if (data.reserved) return '#ef6c00';
        return '#2e7d32';
    }

    function getStatusText(data) {
        if (data.closed) return 'Item Closed';
        if (data.reserved) {
            if (data.reserved === currentUserId) return 'Reserved by You';
            return 'Currently Reserved';
        }
        return 'Available for Reservation';
    }

    function createActionButtons(data, container) {
        console.log('Creating action buttons for item:', {
            isOwner: data.userId === currentUserId,
            isReservedByMe: data.reserved === currentUserId,
            reserved: data.reserved,
            closed: data.closed
        });

        let isOwner = data.userId === currentUserId;
        let isReservedByMe = data.reserved === currentUserId;

        if (data.closed) {
            if (isReservedByMe && data.rating) {
                container.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <p style="margin: 0; color: #2e7d32; font-family: Inter;">
                                <strong>You rated this item:</strong>
                            </p>
                            <div style="font-size: 24px; color: #ffc107; margin: 10px 0;">
                                ${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}
                            </div>
                            <p style="margin: 0; color: #666; font-size: 14px;">
                                Thank you for your feedback!
                            </p>
                        </div>
                        <button onclick="window.location.href='home.html'"
                                style="background: #62931B; color: white; border: none; padding: 12px 24px;
                                       border-radius: 25px; font-family: Inter; font-weight: 700;
                                       font-size: 16px; cursor: pointer; width: 100%; max-width: 300px;">
                            Back to Home
                        </button>
                    </div>
                `;
            } else if (isReservedByMe && !data.rating) {
                container.innerHTML = createRatingInterface(data);
            } else {
                container.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <p style="margin: 0; color: #c62828; font-family: Inter; font-weight: 500;">
                                This item is no longer available
                            </p>
                        </div>
                        <button onclick="window.location.href='home.html'"
                                style="background: #62931B; color: white; border: none; padding: 12px 24px;
                                       border-radius: 25px; font-family: Inter; font-weight: 700;
                                       font-size: 16px; cursor: pointer; width: 100%; max-width: 300px;">
                            Back to Home
                        </button>
                    </div>
                `;
            }
        } else if (isOwner) {
            if (data.reserved) {
                container.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <p style="margin: 0; color: #ef6c00; font-family: Inter;">
                                <strong>Reserved by:</strong> ${data.reservedName || 'Someone'}
                            </p>
                        </div>
                        <button onclick="closeItem('${data.id}')"
                                style="background: #62931B; color: white; border: none; padding: 12px 24px;
                                       border-radius: 25px; font-family: Inter; font-weight: 700;
                                       font-size: 16px; cursor: pointer; width: 100%; max-width: 300px;">
                            Mark as Completed/Closed
                        </button>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div style="padding: 20px; text-align: center;">
                        <button onclick="closeItem('${data.id}')"
                                style="background: #62931B; color: white; border: none; padding: 12px 24px;
                                       border-radius: 25px; font-family: Inter; font-weight: 700;
                                       font-size: 16px; cursor: pointer; width: 100%; max-width: 300px;">
                            Mark as Completed/Closed
                        </button>
                    </div>
                `;
            }
        } else if (isReservedByMe) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <p style="margin: 0; color: #2e7d32; font-family: Inter; font-weight: 500;">
                            ✓ You have reserved this item
                        </p>
                    </div>
                    <button onclick="cancelReservation('${data.id}')"
                            style="background: #FF6B6B; color: white; border: none; padding: 12px 24px;
                                   border-radius: 25px; font-family: Inter; font-weight: 700;
                                   font-size: 16px; cursor: pointer; width: 100%; max-width: 300px;">
                        Cancel Reservation
                    </button>
                </div>
            `;
        } else if (data.reserved) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <p style="margin: 0; color: #ef6c00; font-family: Inter; font-weight: 500;">
                            This item is already reserved
                        </p>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <button onclick="reserveItem('${data.id}')"
                            style="background: #62931B; color: white; border: none; padding: 12px 24px;
                                   border-radius: 25px; font-family: Inter; font-weight: 700;
                                   font-size: 16px; cursor: pointer; width: 100%; max-width: 300px;">
                        Reserve This Item
                    </button>
                </div>
            `;
        }
    }

    function createRatingInterface(data) {
        return `
            <div style="padding: 20px; text-align: center; max-width: 400px; margin: 0 auto;">
                <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 15px 0; color: #1565c0; font-family: Inter;">
                        Rate Your Experience
                    </h3>
                    <p style="margin: 0 0 20px 0; color: #333; font-size: 14px;">
                        How would you rate your experience with this item?
                    </p>

                    <div style="margin-bottom: 20px;">
                        <input type="range" id="rating-slider" min="1" max="5" value="3" step="1"
                               style="width: 100%; height: 40px;"
                               oninput="updateRatingStars(this.value)">
                        <div id="rating-display" style="margin-top: 15px;">
                            <div style="font-size: 32px; color: #ffc107; margin-bottom: 10px;">
                                ★★★☆☆
                            </div>
                            <div style="color: #333; font-weight: 700; font-size: 18px;">
                                3 out of 5 stars
                            </div>
                        </div>
                    </div>

                    <button onclick="submitRating('${data.id}', '${data.userId}')"
                            style="background: #62931B; color: white; border: none; padding: 12px 24px;
                                   border-radius: 25px; font-family: Inter; font-weight: 700;
                                   font-size: 16px; cursor: pointer; width: 100%;">
                        Submit Rating
                    </button>
                </div>
            </div>

            <script>
                function updateRatingStars(value) {
                    const stars = ['☆☆☆☆☆', '★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★'];
                    const display = document.getElementById('rating-display');
                    if (display) {
                        display.innerHTML = \`
                            <div style="font-size: 32px; color: #ffc107; margin-bottom: 10px;">
                                \${stars[value]}
                            </div>
                            <div style="color: #333; font-weight: 700; font-size: 18px;">
                                \${value} out of 5 stars
                            </div>
                        \`;
                    }
                }

                // Initialize the display
                document.addEventListener('DOMContentLoaded', function() {
                    updateRatingStars(3);
                });
            </script>
        `;
    }

    // Action Functions
    window.closeItem = function(itemId) {
        if (confirm('Are you sure you want to close this item? This will mark it as completed.')) {
            showLoading('Closing item...');

            db.collection('items').doc(itemId).update({
                closed: true,
                closedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(function() {
                showSuccess('Item closed successfully!');
                setTimeout(function() {
                    window.location.href = 'home.html';
                }, 1500);
            })
            .catch(function(error) {
                console.error('Error closing item:', error);
                showError('Failed to close item: ' + error.message);
            });
        }
    };

    window.cancelReservation = function(itemId) {
        if (confirm('Are you sure you want to cancel your reservation?')) {
            showLoading('Cancelling reservation...');

            db.collection('items').doc(itemId).update({
                reserved: null,
                reservedName: null
            })
            .then(function() {
                showSuccess('Reservation cancelled!');
                setTimeout(function() {
                    location.reload();
                }, 1500);
            })
            .catch(function(error) {
                console.error('Error cancelling reservation:', error);
                showError('Failed to cancel reservation: ' + error.message);
            });
        }
    };

    window.reserveItem = function(itemId) {
        if (confirm('Are you sure you want to reserve this item?')) {
            showLoading('Reserving item...');

            db.collection('items').doc(itemId).update({
                reserved: currentUserId,
                reservedName: currentUserName || currentUserEmail
            })
            .then(function() {
                showSuccess('Item reserved successfully!');
                setTimeout(function() {
                    location.reload();
                }, 1500);
            })
            .catch(function(error) {
                console.error('Error reserving item:', error);
                showError('Failed to reserve item: ' + error.message);
            });
        }
    };

    window.submitRating = async function(itemId, ownerId) {
        const ratingInput = document.getElementById('rating-slider');
        if (!ratingInput) {
            showError('Rating input not found');
            return;
        }

        const rating = parseInt(ratingInput.value);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            showError('Please select a valid rating (1-5)');
            return;
        }

        if (confirm(`Submit ${rating} star rating for this item?`)) {
            showLoading('Submitting rating...');

            try {
                // Update item with rating
                await db.collection('items').doc(itemId).update({
                    rating: rating,
                    ratedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Update owner's rating stats
                const ownerRef = db.collection('users').doc(ownerId);
                const ownerDoc = await ownerRef.get();

                if (ownerDoc.exists) {
                    const ownerData = ownerDoc.data();
                    const currentSum = (ownerData.ratingSum || 0) + rating;
                    const currentCount = (ownerData.ratingCount || 0) + 1;
                    const average = currentSum / currentCount;

                    await ownerRef.update({
                        ratingSum: currentSum,
                        ratingCount: currentCount,
                        rating: average.toFixed(1)
                    });
                }

                showSuccess('Thank you for your rating!');
                setTimeout(function() {
                    location.reload();
                }, 1500);
            } catch (error) {
                console.error('Error submitting rating:', error);
                showError('Failed to submit rating: ' + error.message);
            }
        }
    };

    // Utility Functions
    function showLoading(message) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-overlay';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            color: white;
            font-family: Inter;
            font-size: 18px;
        `;
        loadingDiv.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 48px; margin-bottom: 20px;">⏳</div>
                <div>${escapeHtml(message)}</div>
            </div>
        `;
        document.body.appendChild(loadingDiv);
    }

    function showSuccess(message) {
        removeLoading();
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #4caf50;
            color: white;
            padding: 20px 30px;
            border-radius: 8px;
            font-family: Inter;
            font-size: 16px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 2000);
    }

    function showError(message) {
        removeLoading();
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f44336;
            color: white;
            padding: 20px 30px;
            border-radius: 8px;
            font-family: Inter;
            font-size: 16px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }

    function removeLoading() {
        const loading = document.getElementById('loading-overlay');
        if (loading) loading.remove();
    }

    function showErrorMessage(message) {
        const container = document.getElementById('info') || document.body;
        container.innerHTML = `
            <div style="width: 100%; text-align: center; padding: 40px;">
                <div style="font-size: 48px; color: #f44336; margin-bottom: 20px;">⚠️</div>
                <p style="color: #333; font-size: 18px; font-family: Inter; margin-bottom: 30px;">
                    ${escapeHtml(message)}
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="location.reload()"
                            style="background: #2196f3; color: white; border: none; padding: 10px 20px;
                                   border-radius: 25px; font-family: Inter; font-weight: 500; cursor: pointer;">
                        Try Again
                    </button>
                    <button onclick="window.location.href='home.html'"
                            style="background: #62931B; color: white; border: none; padding: 10px 20px;
                                   border-radius: 25px; font-family: Inter; font-weight: 500; cursor: pointer;">
                        Go Home
                    </button>
                </div>
            </div>
        `;
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
