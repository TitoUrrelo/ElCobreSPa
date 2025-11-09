// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
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
  appId: "1:546665464505:web:30424a815f56fb7f055168",
  measurementId: "G-01ZHGPMDT9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);