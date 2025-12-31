document.addEventListener('DOMContentLoaded', function() {
    console.log('Home page loaded');

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

    auth.onAuthStateChanged(function(user) {
        if (!user) {
            console.log('No user logged in, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        console.log('User logged in:', user.email);
        loadItems();
    });

    function loadItems() {
        console.log('Loading items from Firestore...');

        db.collection('items').get()
            .then(function(querySnapshot) {
                const itemList = document.getElementById('recommendation');
                if (!itemList) {
                    console.error('Recommendation container not found!');
                    return;
                }

                // Clear any existing loading indicator
                itemList.innerHTML = '';

                let i = 0;
                querySnapshot.forEach(function(doc) {
                    const data = doc.data();
                    data.id = doc.id;
                    console.log('Document Data:', data);

                    // Skip closed items
                    if (data.closed) {
                        console.log('Item is closed, skipping:', data.id);
                        return;
                    }

                    // Check if itemImageUrl is valid
                    if (!data.itemImageUrl) {
                        console.error('Invalid itemImageUrl:', data.itemImageUrl);
                        createItemWithoutImage(data, itemList, i);
                        i++;
                        return;
                    }

                    try {
                        const imageUrl = new URL(data.itemImageUrl);
                        const pathName = imageUrl.pathname;
                        const imageFilename = pathName.substring(pathName.lastIndexOf('/') + 1);

                        // Try to load image from Firebase Storage
                        const imageRef = storage.ref(imageFilename);

                        imageRef.getDownloadURL()
                            .then(function(url) {
                                createItemWithImage(data, itemList, i, url);
                                i++;
                                updateContainerHeight(itemList, i);
                            })
                            .catch(function(error) {
                                console.error('Error getting download URL:', error);
                                createItemWithoutImage(data, itemList, i);
                                i++;
                                updateContainerHeight(itemList, i);
                            });
                    } catch (error) {
                        console.error('Error constructing URL from itemImageUrl:', error);
                        createItemWithoutImage(data, itemList, i);
                        i++;
                        updateContainerHeight(itemList, i);
                    }
                });

                // If no items found
                if (i === 0) {
                    itemList.innerHTML = `
                        <div style="color: #666; font-size: 16px; text-align: center; padding: 40px;">
                            No items available right now. Check back later!
                        </div>
                    `;
                }
            })
            .catch(function(error) {
                console.error('Error getting documents:', error);
                const itemList = document.getElementById('recommendation');
                if (itemList) {
                    itemList.innerHTML = `
                        <div style="color: #FF6B6B; font-size: 16px; text-align: center; padding: 40px;">
                            Error loading items. Please try again.
                        </div>
                    `;
                }
            });
    }

    function createItemWithImage(data, container, index, imageUrl) {
        const leftPos = Math.floor(index % 3) * 116;
        const topPos = Math.floor(index / 3) * 170 + 45;

        const div = document.createElement('div');
        div.innerHTML = `
            <div style="width: 100px; height: 177px; padding-bottom: 25px; left: ${leftPos}px; top: ${topPos}px; position: absolute;">
                <a href="product_info.html?itemId=${data.id}">
                    <div style="width: 100px; height: 110px; background-image: url('${imageUrl}'); background-size: contain; background-repeat: no-repeat; background-position: center center; border-radius: 8px;"></div>
                    <div style="top: 120px; position: absolute; width: 100px; color: black; font-size: 14px; font-family: Inter; font-weight: 600; word-wrap: break-word;">${data.name || 'No Name'}</div>
                    <div style="position: relative; top: 32px; width: 100px; color: black; font-size: 14px; font-family: Inter; font-weight: 400; word-wrap: break-word;">${data.quantity || 'N/A'}</div>
                </a>
            </div>
        `;
        container.appendChild(div);
    }

    function createItemWithoutImage(data, container, index) {
        const leftPos = Math.floor(index % 3) * 116;
        const topPos = Math.floor(index / 3) * 170 + 45;

        const div = document.createElement('div');
        div.innerHTML = `
            <div style="width: 100px; height: 177px; padding-bottom: 25px; left: ${leftPos}px; top: ${topPos}px; position: absolute;">
                <a href="product_info.html?itemId=${data.id}">
                    <div style="width: 100px; height: 110px; background: #F6F6F6; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <div style="color: #999; font-size: 12px;">No Image</div>
                    </div>
                    <div style="top: 120px; position: absolute; width: 100px; color: black; font-size: 14px; font-family: Inter; font-weight: 600; word-wrap: break-word;">${data.name || 'No Name'}</div>
                    <div style="position: relative; top: 32px; width: 100px; color: black; font-size: 14px; font-family: Inter; font-weight: 400; word-wrap: break-word;">${data.quantity || 'N/A'}</div>
                </a>
            </div>
        `;
        container.appendChild(div);
    }

    function updateContainerHeight(container, itemCount) {
        const rows = Math.ceil(itemCount / 3);
        const newHeight = rows * 170 + 200;
        container.style.minHeight = `${newHeight}px`;
    }

    const searchInput = document.querySelector('input[placeholder="Search"]');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    window.location.href = `search.html?query=${encodeURIComponent(searchTerm)}`;
                }
            }
        });
    }
});
