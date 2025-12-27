import { db } from './firebaseConfig.js';
import { getStorage, ref as storageRef, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-storage.js';
import { collection, getDocs, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js';
import {
  getAuth, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-auth.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-app.js';
import { deleteDoc, doc } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js';


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
let userId;
let username;
function getQueryParams() {
  var queryParams = {};
  location.search
    .substring(1)
    .split('&')
    .forEach(function (paramPair) {
      const pair = paramPair.split('=');
      queryParams[pair[0]] = decodeURIComponent(pair[1]);
    });
  return queryParams;
}
document.addEventListener('DOMContentLoaded', () => {
  var params = getQueryParams();
  var itemId = params.itemId;
  const storage = getStorage(); // Initialize Firebase Storage instance
  const docRef = doc(db, 'items', itemId);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User is logged in:', user);
      console.log('User is logged in:', user.uid);
      userId = user.uid;
      username = user.email;
      getDocs(collection(db, 'items'))
        .then((querySnapshot) => {
          const itemList = document.getElementById('info'); // Get the container element
          querySnapshot.forEach((docu) => {
            const data = docu.data();
            if (data.id === itemId) {
              console.log(data.username);
              console.log(data.userId);

              const docRef2 = doc(db, 'users', data.userId);
              const docRef3 = doc(db, 'items', itemId);
              const pathName = new URL(data.itemImageUrl).pathname;
              const imageURL = pathName.substring(pathName.lastIndexOf('/') + 1);
              const imageRef = storageRef(storage, `${imageURL}`);

              getDownloadURL(imageRef) // Fetch the URL for the image
                .then((url) => {
                  const div = document.createElement('div'); // Create a new div element
                  div.style.width = '80%';
                  div.style.marginTop = '60px';
                  div.innerHTML = `
                    <div style="height: 354px; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 8px; display: flex">
                      <div style="align-self: stretch; height: 240px; background-image: url('${url}'); background-size: contain; background-position: center; background-repeat: no-repeat; border-radius: 8px"></div>
                      <div style="margin-top:20px; color: black; font-size: 16px; font-family: Inter; font-weight: 700; word-wrap: break-word">${data.name}</div>
                      <div style="width: 343px; height: 79px; position: relative">
                        <div style="width: 343px; left: 0px; top: 0px; position: absolute; color: black; font-size: 14px; font-family: Inter; font-weight: 400; word-wrap: break-word">${data.quantity}</div>
                        <div style="left: 0px; top: 25px; position: absolute; text-align: right; color: #94BF1A; font-size: 12px; font-family: Inter; font-weight: 300; word-wrap: break-word">
                          Uploaded on ${data.time} by
                          <a style="font-family: Inter; font-weight: 300; text-decoration: underline; color: #94BF1A;" href="another_profile.html?userId=${data.userId}&itemId=${data.id}">${data.username}</a>
                        </div>
                      </div>
                    </div>
                  `;
                  itemList.appendChild(div); // Append the div to the container element


                  //the button
                  if (data.userId === userId && data.rating >= 1) {
                    const buttondiv = document.getElementById('buttondiv'); // Get the container element
                    const ratingDiv = document.createElement('div');
                    ratingDiv.innerHTML = `
                    <p style="font-weight: 400; font-size:12px; font-family: Inter; color:red">This item is already rated: ${data.rating}</p> `;
                    buttondiv.appendChild(ratingDiv);
                  } //owner can see rating
                  else if (data.rating >= 1) {
                    const buttondiv = document.getElementById('buttondiv'); // Get the container element
                    const ratingDiv = document.createElement('div');
                    ratingDiv.innerHTML = `
                    <p style="font-weight: 400; font-size:12px; font-family: Inter; color:red">This item is already rated by you: ${data.rating}</p> `;
                    buttondiv.appendChild(ratingDiv);
                  } // buyer can see rating
                  else if (data.reserved && userId === data.userId) {
                    const buttondiv = document.getElementById('buttondiv'); // Get the container element
                    const button = document.createElement('div');
                    button.innerHTML = `
  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 20vh; text-align: center; gap: 30px">
    <p style="color: red; font-size: 12px; font-family: Inter; font-weight: 400; margin: 0;">
      This item is reserved by ${data.reservedName}
    </p>
    <div style="height: 22px; padding-left: 120px; padding-right: 120px; padding-top: 16px; padding-bottom: 16px; background: #62931B; border-radius: 100px; display: inline-flex; justify-content: center; align-items: center; margin-top: 20px;">
      <a id="close" style="text-align: center; color: white; font-size: 16px; font-family: 'Inter'; font-weight: 700; text-decoration: none;">
        Close item
      </a>
    </div>
    //my code on delete button - real:
    <div style="height: 22px; padding-left: 120px; padding-right: 120px; padding-top: 16px; padding-bottom: 16px; background: #62931B; border-radius: 100px; display: inline-flex; justify-content: center; align-items: center; margin-top: 20px;">
      <a id="delete" style="text-align: center; color: white; font-size: 16px; font-family: 'Inter'; font-weight: 700; text-decoration: none;">
        Delete item
      </a>
    </div>
  </div>
`;
                    console.log('Created button:', button.outerHTML);
                    buttondiv.appendChild(button); // Append the div to the container element
                    document.getElementById('close').addEventListener('click', function(event) {
                        const docId = data.id; // Assume you have the document ID
                        console.log(docId);
                        updateDoc(docRef, {
                          closed: true,
                        })
                          .then(() => {
                            console.log('Document successfully updated!');
                          })
                          .catch((error) => {
                            console.error('Error updating document: ', error);
                          });
                      });
                    //This is a code that should be negligible, but just in case the other code for the delete button doesn't work, use this.
                    buttondiv.appendChild(button)
                    document.getElementById('delete').addEventListener('click', function(event) {
                        const docId = data.id; // Assume you have the document ID
                        console.log(docId);
                        console.log("delete button is clicked");
                        deleteDoc(docRef);
                        console.log('Document successfully updated!');
                    }); //owner can see who reserved
                  }

                  else if (data.reserved === userId && data.closed) {
                    const buttondiv = document.getElementById('buttondiv'); // Get the container element
                    const ratingDiv = document.createElement('div');
                    ratingDiv.style.width="80%";
                    ratingDiv.innerHTML = `
  <div style="max-width: 340px; width: 100%; margin: 0 auto;">
    <label style="font-size: 14px; font-family: Inter; font-weight: 500;" for="rating">Rate your experience</label>
    <input type="range" id="rating" name="rating" min="1" max="5" step="1" style="width: 100%;">
<!--    <button id="submitRating" style="width: 100%; margin-top: 10px; padding: 10px; background-color: #62931B; color: white; border: none; border-radius: 5px; cursor: pointer;">-->
<!--      Submit Rating-->
<!--    </button>-->
     <div
         style="margin-top:10px;height: 22px; padding-left: 110px; padding-right: 110px; padding-top: 16px; padding-bottom: 16px; position: relative; background: #62931B; border-radius: 100px; display: inline-flex; justify-content: center; align-items: center;">
         <a id="submitRating" style=" text-align: center; color: white; font-size: 16px; font-family: 'Inter'; font-weight: 700; text-decoration: none;">Submit </a>
     </div>
  </div>
`;
                    buttondiv.appendChild(ratingDiv); // Append the rating div to the container element
                    document.getElementById('submitRating').addEventListener('click', async function(event) {
                      const rating = parseInt(document.getElementById('rating').value);
                      try {
                        const docSnap = await getDoc(docRef2);
                        if (docSnap.exists()) {
                          const currentData = docSnap.data();
                          const newRatingSum = (currentData.ratingSum || 0) + rating;
                          const newRatingCount = (currentData.ratingCount || 0) + 1;
                          const newRating = newRatingSum/newRatingCount;
                          await updateDoc(docRef2, {
                            ratingSum: newRatingSum,
                            ratingCount: newRatingCount,
                            rating: newRating
                          });
                          await updateDoc(docRef3, {
                            rating: rating
                          });
                          console.log('Rating successfully submitted!');
                        } else {
                          console.error('Document not found!');
                        }
                      } catch (error) {
                        console.error('Error getting or updating document: ', error);
                      }
                    });
                } //buyer can rate
                  else if (data.reserved === userId) {
                    const buttondiv = document.getElementById('buttondiv'); // Get the container element
                    const button = document.createElement('div');
                    button.innerHTML = `
                     <div
                      style="height: 22px; padding-left: 110px; padding-right: 110px; padding-top: 16px; padding-bottom: 16px; position: relative; background: #62931B; border-radius: 100px; display: inline-flex; justify-content: center; align-items: center;">
                      <a id="close" style="text-align: center; color: white; font-size: 16px; font-family: 'Inter'; font-weight: 700; text-decoration: none;">Cancel reserve</a>
                    </div>`;
                    buttondiv.appendChild(button); // Append the div to the container element
                    document.getElementById('close').addEventListener('click', function(event) {
                      const docId = data.id; // Assume you have the document ID
                      console.log(docId);
                      updateDoc(docRef, {
                        reserved: null
                      })
                        .then(() => {
                          console.log('Document successfully updated!');
                        })
                        .catch((error) => {
                          console.error('Error updating document: ', error);
                        });
                    });
                  } //buyer can cancel reserve
                  else if (data.userId === userId && !data.closed) { //onwer can close an item
                    const buttondiv = document.getElementById('buttondiv'); // Get the container element
                    const button = document.createElement('div');
                    button.innerHTML = `
                  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 10px;">
                    <div style="height: 22px; padding-left: 120px; padding-right: 120px; padding-top: 16px; padding-bottom: 16px; position: relative; background: #62931B; border-radius: 100px; display: inline-flex; justify-content: center; align-items: center;">
                      <a id="close"
                          style="text-align: center; color: white; font-size: 16px; font-family: 'Inter'; font-weight: 700; text-decoration: none;">Close item</a>
                    </div>
                    <div style="height: 22px; padding-left: 120px; padding-right: 120px; padding-top: 16px; padding-bottom: 16px; background: #62931B; border-radius: 100px; display: inline-flex; justify-content: center; align-items: center; margin-top: 20px;">
                        <a id="delete" style="text-align: center; color: white; font-size: 16px; font-family: 'Inter'; font-weight: 700; text-decoration: none;">
                          Delete item
                        </a>
                    </div>
                    </div>`;
                    buttondiv.appendChild(button); // Append the div to the container element
                    document.getElementById('close').addEventListener('click', function(event) {
                      const docId = data.id; // Assume you have the document ID
                      console.log(docId);
                      updateDoc(docRef, {
                        closed: true,
                      })
                        .then(() => {
                          console.log('Document successfully updated!');
                        })
                        .catch((error) => {
                          console.error('Error updating document: ', error);
                        });
                    });
                    //This should be the code for the delete button that works
                    buttondiv.appendChild(button);
                    document.getElementById('delete').addEventListener('click', function(event) {
                        const modal = document.createElement('div');
                        modal.style.cssText = `
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: rgba(0,0,0,0.7);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            z-index: 1000;
                        `;

                        modal.innerHTML = `
                            <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center; max-width: 400px; width: 80%;">
                                <h3 style="color: #dc3545;">Confirm Deletion</h3>
                                <p>Are you sure you want to delete this item? This cannot be undone.</p>
                                <div style="margin-top: 1.5rem; display: flex; justify-content: center; gap: 10px;">
                                    <button id="confirmDelete" style="background: #dc3545; color: white; padding: 0.5rem 1.5rem; border: none; border-radius: 4px; cursor: pointer;">
                                        Delete Permanently
                                    </button>
                                    <button id="cancelDelete" style="background: #6c757d; color: white; padding: 0.5rem 1.5rem; border: none; border-radius: 4px; cursor: pointer;">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        `;

                        document.body.appendChild(modal);
                        document.getElementById('confirmDelete').addEventListener('click', async function() {
                            try {
                                await deleteDoc(docRef); 
                                console.log("Document successfully deleted!");
                                document.body.removeChild(modal);
                                alert("Item deleted successfully!");
                            } catch (error) {
                                console.error("Error deleting document:", error);
                                alert("Failed to delete item. Please try again.");
                            }
                        });
                        document.getElementById('cancelDelete').addEventListener('click', function() {
                            document.body.removeChild(modal); 
                        });
                    });
                  }
                  else if (data.closed === true) {
                    const buttondiv = document.getElementById('buttondiv'); // Get the container element
                    const button = document.createElement('div');
                    button.innerHTML = `<p style="color:red;  font-family: Inter; font-size:12px; font-weight: 400;">This item is closed!</p>`;
                    buttondiv.appendChild(button); // Append the div to the container element
                  } //buyer can see if an item is closed or not
                  else {
                    const buttondiv = document.getElementById('buttondiv'); // Get the container element
                    const button = document.createElement('div');
                    button.innerHTML = `<div
                      style="height: 22px; padding-left: 110px; padding-right: 110px; padding-top: 16px; padding-bottom: 16px; position: relative; background: #62931B; border-radius: 100px; display: inline-flex; justify-content: center; align-items: center;">
                      <a id="close"
                         style="text-align: center; color: white; font-size: 16px; font-family: 'Inter'; font-weight: 700; text-decoration: none;">Reserve item</a>
                    </div>`;
                    buttondiv.appendChild(button); // Append the div to the container element
                    document.getElementById('close').addEventListener('click', function(event) {
                      const docId = data.id; // Assume you have the document ID
                      console.log(docId);
                      updateDoc(docRef, {
                        reserved:userId,
                        reservedName:username,
                      })
                        .then(() => {
                          console.log('Document successfully updated!');
                        })
                        .catch((error) => {
                          console.error('Error updating document: ', error);
                        });
                    });
                  } // buyer can reserve
                })
                .catch((error) => {
                  console.error('Error getting download URL: ', error);
                });
            }
          });
        })
        .catch((error) => {
          console.error("Error getting documents: ", error);
        });
    } else {
      window.location.href = 'login.html';
    }
  });
});
