// Simple test to manually verify admin email
const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

const firebaseConfig = {
  apiKey: "AIzaSyBCr4QZ45MdiDdN3I5WQnS0TVPcNi1sTdo",
  authDomain: "signtalk-cb7eb.firebaseapp.com",
  projectId: "signtalk-cb7eb",
  storageBucket: "signtalk-cb7eb.appspot.com",
  messagingSenderId: "1618713415",
  appId: "1:1618713415:web:4a8b8a8c8d8e8f90123456"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

async function testVerifyAdmin() {
  try {
    console.log('Testing verifyAdminEmail function...');
    const verifyAdminEmail = httpsCallable(functions, 'verifyAdminEmail');
    const result = await verifyAdminEmail({ email: 'deibreyes1@gmail.com' });
    console.log('Success:', result.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testVerifyAdmin();