// scripts/auth.js

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyC2pHhSThFkKhN-c1sdhUATt1-zmNLV9sw",
  authDomain: "megaspeedrunsdatabase.firebaseapp.com",
  databaseURL: "https://megaspeedrunsdatabase-default-rtdb.firebaseio.com",
  projectId: "megaspeedrunsdatabase",
  storageBucket: "megaspeedrunsdatabase.firebasestorage.app",
  messagingSenderId: "545413984550",
  appId: "1:545413984550:web:79c899026a21f6343091e7"
});

const auth = firebase.auth();

// Set persistence to LOCAL so login state survives page reloads & navigation
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("Firebase Auth persistence set to LOCAL");
  })
  .catch((error) => {
    console.error("Error setting Firebase Auth persistence:", error);
  });

// Optional: helper function to get current user immediately
function getCurrentUser() {
  return auth.currentUser;
}
