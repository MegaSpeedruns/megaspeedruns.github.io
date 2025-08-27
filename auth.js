// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyC2pHhSThFkKhN-c1sdhUATt1-zmNLV9sw",
  authDomain: "megaspeedrunsdatabase.firebaseapp.com",
  databaseURL: "https://megaspeedrunsdatabase-default-rtdb.firebaseio.com",
  projectId: "megaspeedrunsdatabase",
  storageBucket: "megaspeedrunsdatabase.appspot.com",
  messagingSenderId: "545413984550",
  appId: "1:545413984550:web:79c899026a21f6343091e7"
});

const auth = firebase.auth();
const db = firebase.database();

// Enable login persistence across the entire domain
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch(err => console.error("Persistence error:", err));
