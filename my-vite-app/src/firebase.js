// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
	apiKey: "AIzaSyDEAMlmP3QTsSKXLTmTI8nZAGw3R4izjEs",
	authDomain: "signtalk-cb7eb.firebaseapp.com",
	projectId: "signtalk-cb7eb",
	storageBucket: "signtalk-cb7eb.firebasestorage.app",
	messagingSenderId: "1618713415",
	appId: "1:1618713415:web:91a76e0642fd82327c0a62",
	measurementId: "G-53M0NNFZ1D",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// para makuha yung laman ng firestore
const firestore = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, analytics, firestore, auth, storage };