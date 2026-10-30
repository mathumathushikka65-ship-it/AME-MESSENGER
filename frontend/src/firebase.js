// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDVLHGaxH-OdnwyQvgmjalKtUuvtVjfWwQ",
  authDomain: "ame-messanger.firebaseapp.com",
  projectId: "ame-messanger",
  storageBucket: "ame-messanger.firebasestorage.app",
  messagingSenderId: "397970431098",
  appId: "1:397970431098:web:13720fac1f40e035bc2fc3",
  measurementId: "G-TKSHBP73LP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);