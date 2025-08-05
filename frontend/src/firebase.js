// ✅ frontend/src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// ✅ Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVnjOkIJ6llvpbimcfJmE9wgFfVSodUk8",
  authDomain: "movie-app-5413d.firebaseapp.com",
  projectId: "movie-app-5413d",
  storageBucket: "movie-app-5413d.appspot.com",
  messagingSenderId: "175468721008",
  appId: "1:175468721008:web:d1c22105c3ad405a36d5b5",
  measurementId: "G-D0S0WZVYLS"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ✅ Set up auth and Google provider
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, signOut };
