const {onRequest, onCall} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});
const nodemailer = require("nodemailer");

// Load environment variables from .env file ONLY for local emulator
// Do NOT load in production to avoid conflicts with secrets
const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
if (isEmulator) {
  logger.info('Running in emulator mode, loading .env file');
  require('dotenv').config();
}

// Initialize Firebase Admin SDK
admin.initializeApp();

// Email configuration using environment variables for Firebase Functions v2
const createTransporter = () => {
  // Try multiple configurations for better compatibility
  const configs = [
    // Primary Gmail SMTP configuration
    {
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "signtalk625@gmail.com",
        pass: process.env.EMAIL_PASS || "SignTalk@2025",
      },
    },
    // Alternative Gmail SMTP configuration
    {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || "signtalk625@gmail.com",
        pass: process.env.EMAIL_PASS || "SignTalk@2025",
      },
    },
  ];
  
  // Return the primary configuration
  return nodemailer.createTransport(configs[0]);
};

// Send verification email
const sendVerificationEmail = async (email, verificationLink, adminName) => {
  try {
    const transporter = createTransporter();
    
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
    const emailUser = isEmulator 
      ? (process.env.LOCAL_EMAIL_USER || "signtalk625@gmail.com")
      : (process.env.EMAIL_USER || "signtalk625@gmail.com");
    
    const mailOptions = {
      from: `SignTalk Admin <${emailUser}>`,
      to: email,
      subject: "Verify your SignTalk Admin Account",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #6D2593, #8A4FB8); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">SignTalk Admin</h1>
            <p style="margin: 5px 0 0 0;">Account Verification Required</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #6D2593; margin-top: 0;">Welcome ${adminName || 'Admin'}!</h2>
            
            <p>Your SignTalk admin account has been created successfully. To complete the setup and gain access to the admin dashboard, please verify your email address.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background: linear-gradient(135deg, #6D2593, #8A4FB8); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(109, 37, 147, 0.3);">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationLink}" style="color: #6D2593; word-break: break-all;">${verificationLink}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              This is an automated message. Please do not reply to this email.<br>
              If you didn't request this account, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent successfully to ${email}:`, result.messageId);
    return result;
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error);
    throw error;
  }
};

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

    // Update password metadata in Firestore (without storing the password itself)
    const userDocRef = admin.firestore().collection("users").doc(userRecord.uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      await userDocRef.update({
        passwordUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        passwordUpdatedBy: adminUid,
      });

      logger.info(`Updated password metadata for ${email}`);
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
  secrets: ["EMAIL_USER", "EMAIL_PASS"],
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

    // Create Firebase Auth account with email verification disabled initially
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: false, // Require email verification
    });

    logger.info(`Created Firebase Auth account: ${userRecord.uid}`);
    
    // Generate email verification link with redirect to login page
    const appUrl = process.env.APP_URL || 'http://localhost:5175';
    logger.info(`Using app URL for verification: ${appUrl}`);
    
    const actionCodeSettings = {
      // URL to redirect after email verification (login page)
      url: appUrl,
      // This must be false to let Firebase handle verification completely
      handleCodeInApp: false,
    };
    
    const verificationLink = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
    logger.info(`Generated email verification link for ${email}: ${verificationLink}`);

    // Try to send verification email, but don't fail if it doesn't work
    let emailSent = false;
    try {
      await sendVerificationEmail(email, verificationLink, name);
      logger.info(`Verification email sent successfully to ${email}`);
      emailSent = true;
    } catch (emailError) {
      logger.error(`Failed to send verification email to ${email}:`, emailError);
      logger.info(`Email sending failed, but account created. Verification link available for manual sharing: ${verificationLink}`);
      // Continue with account creation even if email fails
      // The verification link will be provided in the response for manual sharing
    }

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

    // Create Firestore document (password is securely stored in Firebase Auth)
    const adminData = {
      name: name,
      email: email,
      userType: "admin",
      uid: userRecord.uid,
      formatted_uid: nextFormattedUID,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: adminUid,
      authCreated: true,
      verificationLink: verificationLink,
    };

    await admin.firestore()
        .collection("users")
        .doc(userRecord.uid)
        .set(adminData);

    logger.info(`Created Firestore document for admin: ${userRecord.uid}`);

    return {
      success: true,
      message: emailSent 
        ? `Admin account successfully created for ${email}. A verification email has been sent.`
        : `Admin account successfully created for ${email}. Email sending failed - please use the verification link provided.`,
      uid: userRecord.uid,
      formattedUid: nextFormattedUID,
      verificationLink: verificationLink,
      requiresEmailVerification: true,
      emailSent: emailSent,
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

