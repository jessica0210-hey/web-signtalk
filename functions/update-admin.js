const admin = require('firebase-admin');

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp();
}

async function updateAdminStatus() {
  try {
    const email = 'deibreyes1@gmail.com';
    const uid = 'ikd3U1E0v9Sz3lCsR2pGKqJp8K42'; // From the Firestore screenshot
    
    console.log(`Updating admin status for ${email} (${uid})`);
    
    // Update Firebase Auth
    await admin.auth().updateUser(uid, {
      emailVerified: true,
    });
    console.log('✓ Updated Firebase Auth emailVerified to true');
    
    // Update Firestore
    await admin.firestore().collection('users').doc(uid).update({
      emailVerified: true,
      accountStatus: 'active',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✓ Updated Firestore document');
    
    console.log('✅ Admin account verification completed successfully!');
    console.log('The admin can now log in with their credentials.');
    
  } catch (error) {
    console.error('❌ Error updating admin status:', error);
  }
  
  process.exit(0);
}

updateAdminStatus();