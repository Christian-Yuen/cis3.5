// upload.js - Firebase v8 (compat) version for iOS simulator
document.addEventListener('DOMContentLoaded', function() {
    console.log('Upload page loaded');

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

    let currentUserId = null;
    let currentUsername = null;

    // Fixed Item converter - handles undefined values properly
    const itemConverter = {
        toFirestore: function(item) {
            // Create data object, ensuring no undefined values
            const firestoreData = {
                category: item.category || null,
                id: item.id || null,
                imageFileName: item.imageFileName || null,
                imageURL: item.imageURL || null,
                name: item.name || null,
                quantity: item.quantity || null,
                time: item.time || null,
                userId: item.userId || null,
                username: item.username || null,
                reserved: item.reserved || null,
                closed: item.closed || false,
                timestamp: item.timestamp || firebase.firestore.FieldValue.serverTimestamp(),
                itemImageUrl: item.itemImageUrl || item.imageURL || null  // Use imageURL as fallback
            };

            return firestoreData;
        },
        fromFirestore: function(snapshot, options) {
            const data = snapshot.data(options);
            return new Item(
                data.category,
                data.id,
                data.imageFileName,
                data.imageURL || data.itemImageUrl, // Use either field
                data.name,
                data.quantity,
                data.time,
                data.userId,
                data.username,
                data.reserved,
                data.closed,
                data.timestamp
            );
        }
    };

    // Check authentication
    auth.onAuthStateChanged(function(user) {
        if (!user) {
            console.log('No user logged in, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        currentUserId = user.uid;
        console.log('User logged in:', user.email);

        // Get user data
        db.collection('users').doc(currentUserId).get()
            .then(function(docSnapshot) {
                if (docSnapshot.exists) {
                    const data = docSnapshot.data();
                    currentUsername = data.username;
                    console.log('Username:', currentUsername);
                } else {
                    console.error('User document not found');
                }
            })
            .catch(function(error) {
                console.error('Error fetching user data:', error);
            });

        setupUploadForm();
        setupItemPreview(); // Optional: setup preview of existing items
    });

    function setupUploadForm() {
        const submitButton = document.getElementById('submit_button');
        if (!submitButton) {
            console.error('Submit button not found');
            return;
        }

        submitButton.addEventListener('click', function(event) {
            event.preventDefault();
            handleSubmit();
        });

        // Allow Enter key in form fields
        const itemNameInput = document.getElementById('item_name');
        const quantityInput = document.getElementById('quantity');

        if (itemNameInput) {
            itemNameInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSubmit();
                }
            });
        }

        if (quantityInput) {
            quantityInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSubmit();
                }
            });
        }
    }

    function handleSubmit() {
        const itemName = document.getElementById('item_name').value.trim();
        const quantity = document.getElementById('quantity').value.trim();
        const categoryButton = document.getElementById('dropdown_button');
        const category = categoryButton ? categoryButton.textContent : 'Item Category';
        const fileInput = document.getElementById('fileInp');

        // Get current date
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        console.log('Form data:', {
            itemName: itemName,
            quantity: quantity,
            category: category,
            date: formattedDate,
            userId: currentUserId,
            username: currentUsername,
            hasFile: fileInput.files.length > 0
        });

        // Validation
        if (!itemName) {
            alert('Please give your item a name');
            return;
        }

        if (!quantity || quantity < 1) {
            alert('Please input a valid quantity');
            return;
        }

        if (category === 'Item Category') {
            alert('Please select a category for your item');
            return;
        }

        if (!fileInput || fileInput.files.length === 0) {
            alert('Please upload an image');
            return;
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        const file = fileInput.files[0];
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload a PNG, JPG, or JPEG image.');
            return;
        }

        // Validate file size (optional: limit to 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            alert('Image size should be less than 5MB');
            return;
        }

        // Show loading state
        const submitButton = document.getElementById('submit_button');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Uploading...';
        submitButton.disabled = true;

        // Submit the item
        submitItem(itemName, quantity, category, formattedDate, currentUserId, currentUsername, file)
            .then(function(itemId) {
                console.log('Item submitted successfully with ID:', itemId);
                openPopup();

                // Optional: Fetch and display the newly created item using converter
                fetchItemWithConverter(itemId);
            })
            .catch(function(error) {
                console.error('Error submitting item:', error);
                alert('Upload failed: ' + error.message);
            })
            .finally(function() {
                // Reset button state
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            });
    }

    async function submitItem(itemName, itemQuantity, itemCategory, timeUploaded, userId, username, imageFile) {
        try {
            // FIRST: Upload the image to Storage (BASE LEVEL - no folder)
            console.log('Starting image upload...');

            // Create unique filename with timestamp to avoid conflicts
            const timestamp = Date.now();
            const sanitizedName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const fileName = `${userId}_${timestamp}_${sanitizedName}`; // Base level, no folder path

            console.log('Uploading image with filename:', fileName);

            // Upload directly to base storage (no folder)
            const storageRef = storage.ref(fileName);

            // Create upload task with metadata
            const uploadTask = storageRef.put(imageFile, {
                contentType: imageFile.type,
                customMetadata: {
                    uploadedBy: userId,
                    originalName: imageFile.name,
                    uploadedAt: timestamp.toString()
                }
            });

            // Upload the file and get URL
            const snapshot = await uploadTask;
            console.log('Upload completed, getting download URL...');

            // Get download URL
            const downloadURL = await snapshot.ref.getDownloadURL();
            console.log('File available at:', downloadURL);

            // SECOND: Create item object WITH the image URL
            const item = new Item(
                itemCategory,
                null, // id will be set after creation
                fileName, // imageFileName - just the filename (no folder path)
                downloadURL, // imageURL - from the upload
                itemName,
                parseInt(itemQuantity), // Ensure it's a number
                timeUploaded,
                userId,
                username,
                null, // reserved
                false, // closed
                firebase.firestore.FieldValue.serverTimestamp() // timestamp
            );

            console.log('Creating Firestore document with item:', item.toString());

            // THIRD: Create item document in Firestore
            const itemsCollection = db.collection('items').withConverter(itemConverter);
            const docRef = await itemsCollection.add(item);
            const documentId = docRef.id;

            // Update the document with its ID
            await itemsCollection.doc(documentId).update({
                id: documentId
            });

            console.log('Item created successfully with ID:', documentId);
            return documentId;

        } catch (error) {
            console.error('Error in submitItem:', error);

            // Provide more specific error messages
            if (error.code === 'storage/unauthorized') {
                throw new Error('Storage upload failed: Unauthorized. Check Firebase Storage rules.');
            } else if (error.code === 'storage/unknown') {
                throw new Error('Storage upload failed: Unknown error. Check your internet connection.');
            } else if (error.code === 'permission-denied') {
                throw new Error('Firestore write failed: Permission denied. Check Firestore rules.');
            } else if (error.code === 'storage/quota-exceeded') {
                throw new Error('Storage quota exceeded. Please delete some old images.');
            }

            throw error;
        }
    }

    // Function to fetch an item using converter
    async function fetchItemWithConverter(itemId) {
        try {
            const itemsCollection = db.collection('items').withConverter(itemConverter);
            const docRef = itemsCollection.doc(itemId);
            const docSnapshot = await docRef.get();

            if (docSnapshot.exists) {
                const item = docSnapshot.data();
                console.log('Item fetched using converter:', item.toString());
                console.log('Item object:', item);

                // You can now use the item object with all its methods
                if (item.isAvailable()) {
                    console.log('Item is available for reservation');
                }

                return item;
            } else {
                console.log('No such item!');
                return null;
            }
        } catch (error) {
            console.error('Error fetching item with converter:', error);
            throw error;
        }
    }

    // Optional: Function to setup preview of user's existing items
    function setupItemPreview() {
        if (!currentUserId) return;

        // Use converter to fetch user's items
        const itemsCollection = db.collection('items').withConverter(itemConverter);
        itemsCollection.where('userId', '==', currentUserId)
            .where('closed', '==', false)
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get()
            .then(function(querySnapshot) {
                console.log('User has', querySnapshot.size, 'active items');

                querySnapshot.forEach(function(doc) {
                    const item = doc.data();
                    console.log('User item:', item.toString());
                    // You could display these items in a preview section
                });
            })
            .catch(function(error) {
                console.error('Error fetching user items:', error);
            });
    }

    // Function to open the popup
    function openPopup() {
        const popup = document.getElementById('popup');
        if (popup) {
            popup.classList.add('open-popup');

            // Auto-close popup after 5 seconds
            setTimeout(function() {
                closePopup();
            }, 5000);
        }
    }

    // Function to close the popup and reset form
    function closePopup() {
        const popup = document.getElementById('popup');
        if (popup) {
            popup.classList.remove('open-popup');
        }

        // Reset form fields
        resetForm();
    }

    // Reset form function
    function resetForm() {
        // Reset image preview
        const imagePreview = document.getElementById('item-picture');
        if (imagePreview) {
            imagePreview.src = 'images/upload-photo-placeholder.jpeg';
        }

        // Clear file input
        const fileInput = document.getElementById('fileInp');
        if (fileInput) {
            fileInput.value = '';
        }

        // Clear text inputs
        const itemNameInput = document.getElementById('item_name');
        if (itemNameInput) {
            itemNameInput.value = '';
        }

        const quantityInput = document.getElementById('quantity');
        if (quantityInput) {
            quantityInput.value = '';
        }

        // Reset category dropdown
        const categoryButton = document.getElementById('dropdown_button');
        if (categoryButton) {
            categoryButton.textContent = 'Item Category';
        }
    }

    // Make functions available globally for HTML onclick handlers
    window.openPopup = openPopup;
    window.closePopup = closePopup;
    window.fetchItemWithConverter = fetchItemWithConverter;
});

// Enhanced Item class with itemImageUrl property
class Item {
    constructor(category, id, imageFileName, imageURL, name, quantity, time, userId, username, reserved = null, closed = false, timestamp = null) {
        this.category = category;
        this.id = id;
        this.imageFileName = imageFileName;
        this.imageURL = imageURL;
        this.name = name;
        this.quantity = quantity;
        this.time = time;
        this.userId = userId;
        this.username = username;
        this.reserved = reserved;
        this.closed = closed;
        this.timestamp = timestamp;
        this.itemImageUrl = imageURL; // Ensure itemImageUrl is set
    }

    toString() {
        return `${this.category}, ${this.id}, ${this.imageFileName}, ${this.imageURL}, ${this.name}, ${this.quantity}, ${this.time}, ${this.userId}, ${this.username}, Reserved: ${this.reserved}, Closed: ${this.closed}`;
    }

    // Helper methods
    isAvailable() {
        return !this.closed && !this.reserved;
    }

    reserve(userId) {
        if (this.isAvailable()) {
            this.reserved = userId;
            return true;
        }
        return false;
    }

    release() {
        this.reserved = null;
    }

    closeItem() {
        this.closed = true;
    }

    reopenItem() {
        this.closed = false;
    }

    // Get display information
    getDisplayInfo() {
        return {
            name: this.name,
            category: this.category,
            quantity: this.quantity,
            time: this.time,
            username: this.username,
            imageUrl: this.imageURL,
            isAvailable: this.isAvailable(),
            isReserved: !!this.reserved,
            isClosed: this.closed
        };
    }

    // Create from plain object
    static fromObject(obj) {
        return new Item(
            obj.category,
            obj.id,
            obj.imageFileName,
            obj.imageURL,
            obj.name,
            obj.quantity,
            obj.time,
            obj.userId,
            obj.username,
            obj.reserved,
            obj.closed,
            obj.timestamp
        );
    }

    // Convert to plain object for storage (alternative to converter)
    toObject() {
        return {
            category: this.category,
            id: this.id,
            imageFileName: this.imageFileName,
            imageURL: this.imageURL,
            name: this.name,
            quantity: this.quantity,
            time: this.time,
            userId: this.userId,
            username: this.username,
            reserved: this.reserved,
            closed: this.closed,
            timestamp: this.timestamp,
            itemImageUrl: this.itemImageUrl || this.imageURL
        };
    }
}

// Make Item class available globally for other scripts
window.Item = Item;
