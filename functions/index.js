const {onRequest, onCall} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * Cloud Function to reset user password with Admin SDK
 * Callable from client-side React app
 */
exports.resetUserPassword = onCall({
  cors: true,
}, async (request) => {
  try {
    const {email, newPassword, adminUid} = request.data;

    // Verify the caller is an admin
    const adminUser = await admin.auth().getUser(adminUid);
    const adminDoc = await admin.firestore()
        .collection("users")
        .doc(adminUid)
        .get();

    if (!adminDoc.exists || adminDoc.data().userType !== "admin") {
      throw new Error("Unauthorized: Only admins can reset passwords");
    }

    logger.info(`Admin ${adminUid} attempting to reset password for ${email}`);

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    logger.info(`Found user record for ${email}: ${userRecord.uid}`);

    // Update password using Admin SDK
    await admin.auth().updateUser(userRecord.uid, {
      password: newPassword,
    });

    // Also update the password hash in Firestore if document exists
    const userDocRef = admin.firestore().collection("users").doc(userRecord.uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      // Hash the new password for Firestore storage
      const crypto = require("crypto");
      const hashedPassword = crypto.createHash("sha256")
          .update(newPassword)
          .digest("hex");

      await userDocRef.update({
        password: hashedPassword,
        passwordUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        passwordUpdatedBy: adminUid,
      });

      logger.info(`Updated Firestore password hash for ${email}`);
    }

    logger.info(`Successfully reset password for ${email}`);

    return {
      success: true,
      message: `Password successfully reset for ${email}`,
    };
  } catch (error) {
    logger.error("Error resetting password:", error);

    // Handle specific Firebase Auth errors
    let errorMessage = "Failed to reset password";
    if (error.code === "auth/user-not-found") {
      errorMessage = "User not found";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (error.message.includes("Unauthorized")) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
});

/**
 * Cloud Function to delete user account with Admin SDK
 * Callable from client-side React app
 */
exports.deleteUserAccount = onCall({
  cors: true,
}, async (request) => {
  try {
    const {email, adminUid} = request.data;

    // Verify the caller is an admin
    const adminUser = await admin.auth().getUser(adminUid);
    const adminDoc = await admin.firestore()
        .collection("users")
        .doc(adminUid)
        .get();

    if (!adminDoc.exists || adminDoc.data().userType !== "admin") {
      throw new Error("Unauthorized: Only admins can delete accounts");
    }

    logger.info(`Admin ${adminUid} attempting to delete account for ${email}`);

    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    logger.info(`Found user record for ${email}: ${userRecord.uid}`);

    // Delete from Firebase Auth
    await admin.auth().deleteUser(userRecord.uid);
    logger.info(`Deleted Firebase Auth account for ${email}`);

    // Delete from Firestore
    const userDocRef = admin.firestore().collection("users").doc(userRecord.uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      await userDocRef.delete();
      logger.info(`Deleted Firestore document for ${email}`);
    }

    // Also check for any documents with matching email (for pending accounts)
    const usersRef = admin.firestore().collection("users");
    const emailQuery = await usersRef.where("email", "==", email).get();

    if (!emailQuery.empty) {
      const batch = admin.firestore().batch();
      emailQuery.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      logger.info(`Deleted ${emailQuery.docs.length} additional documents for ${email}`);
    }

    logger.info(`Successfully deleted account for ${email}`);

    return {
      success: true,
      message: `Account successfully deleted for ${email}`,
    };
  } catch (error) {
    logger.error("Error deleting account:", error);

    // Handle specific Firebase Auth errors
    let errorMessage = "Failed to delete account";
    if (error.code === "auth/user-not-found") {
      errorMessage = "User not found";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (error.message.includes("Unauthorized")) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
});

/**
 * Cloud Function to create admin account with Admin SDK
 * Callable from client-side React app
 */
exports.createAdminAccount = onCall({
  cors: true,
}, async (request) => {
  try {
    const {name, email, password, adminUid} = request.data;

    // Verify the caller is an admin
    const adminUser = await admin.auth().getUser(adminUid);
    const adminDoc = await admin.firestore()
        .collection("users")
        .doc(adminUid)
        .get();

    if (!adminDoc.exists || adminDoc.data().userType !== "admin") {
      throw new Error("Unauthorized: Only admins can create admin accounts");
    }

    logger.info(`Admin ${adminUid} creating new admin account for ${email}`);

    // Create Firebase Auth account
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });

    logger.info(`Created Firebase Auth account: ${userRecord.uid}`);

    // Generate formatted UID (you may need to adapt this logic)
    const usersRef = admin.firestore().collection("users");
    const snapshot = await usersRef.orderBy("formatted_uid", "desc").limit(1).get();

    let nextFormattedUID = "ADMIN_001";
    if (!snapshot.empty) {
      const lastUser = snapshot.docs[0].data();
      if (lastUser.formatted_uid && lastUser.formatted_uid.startsWith("ADMIN_")) {
        const lastNumber = parseInt(lastUser.formatted_uid.split("_")[1]);
        const nextNumber = lastNumber + 1;
        nextFormattedUID = `ADMIN_${nextNumber.toString().padStart(3, "0")}`;
      }
    }

    // Hash password for Firestore
    const crypto = require("crypto");
    const hashedPassword = crypto.createHash("sha256")
        .update(password)
        .digest("hex");

    // Create Firestore document
    const adminData = {
      name: name,
      email: email,
      password: hashedPassword,
      userType: "admin",
      isOnline: false,
      uid: userRecord.uid,
      formatted_uid: nextFormattedUID,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: adminUid,
      accountStatus: "active",
      authCreated: true,
      passwordHashMethod: "sha256",
    };

    await admin.firestore()
        .collection("users")
        .doc(userRecord.uid)
        .set(adminData);

    logger.info(`Created Firestore document for admin: ${userRecord.uid}`);

    return {
      success: true,
      message: `Admin account successfully created for ${email}`,
      uid: userRecord.uid,
      formattedUid: nextFormattedUID,
    };
  } catch (error) {
    logger.error("Error creating admin account:", error);

    // Handle specific Firebase Auth errors
    let errorMessage = "Failed to create admin account";
    if (error.code === "auth/email-already-exists") {
      errorMessage = "Email already exists";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password is too weak";
    } else if (error.message.includes("Unauthorized")) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
});

/**
 * Cloud Function to get user info by email (for admin purposes)
 * Callable from client-side React app
 */
exports.getUserInfo = onCall({
  cors: true,
}, async (request) => {
  try {
    const {email, adminUid} = request.data;

    // Verify the caller is an admin
    const adminDoc = await admin.firestore()
        .collection("users")
        .doc(adminUid)
        .get();

    if (!adminDoc.exists || adminDoc.data().userType !== "admin") {
      throw new Error("Unauthorized: Only admins can access user info");
    }

    // Get user by email from Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);

    // Get user document from Firestore
    const userDoc = await admin.firestore()
        .collection("users")
        .doc(userRecord.uid)
        .get();

    const userData = userDoc.exists ? userDoc.data() : null;

    return {
      success: true,
      authUser: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled,
        creationTime: userRecord.metadata.creationTime,
        lastSignInTime: userRecord.metadata.lastSignInTime,
      },
      firestoreUser: userData,
    };
  } catch (error) {
    logger.error("Error getting user info:", error);

    let errorMessage = "Failed to get user info";
    if (error.code === "auth/user-not-found") {
      errorMessage = "User not found";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address";
    } else if (error.message.includes("Unauthorized")) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
});