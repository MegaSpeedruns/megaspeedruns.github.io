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

// Ensure login state persists
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => console.log("Persistence set to LOCAL"))
  .catch(err => console.error("Persistence error:", err));
