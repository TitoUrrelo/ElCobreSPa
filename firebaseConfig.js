// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyDAuzM0lSPWFOlwZiwkGYkvqlVj1zfUUN0",
  authDomain: "elcobrespa-backend.firebaseapp.com",
  projectId: "elcobrespa-backend",
  storageBucket: "elcobrespa-backend.firebasestorage.app",
  messagingSenderId: "546665464505",
  appId: "1:546665464505:web:ff6db749db675f48055168",
  measurementId: "G-D0S20MJP6S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);