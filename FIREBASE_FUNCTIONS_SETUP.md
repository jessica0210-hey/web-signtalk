# Firebase Cloud Functions Setup Guide for SignTalk Admin Management

This guide will help you set up Firebase Cloud Functions with Admin SDK privileges for programmatic user management in your SignTalk application.

## Prerequisites
- Node.js 18 or later installed
- Firebase CLI installed globally
- Firebase project with Firestore and Authentication enabled

## Step 1: Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase
```bash
firebase login
```

## Step 3: Initialize Firebase Functions in your project
Navigate to your project root directory and run:
```bash
cd C:\Users\deibr\web-signtalk
firebase init functions
```

When prompted:
- Select "Use an existing project" and choose your Firebase project
- Select JavaScript as the language
- Choose NOT to use ESLint (we have our own config)
- Choose YES to install dependencies with npm

## Step 4: Install Function Dependencies
```bash
cd functions
npm install
```

## Step 5: Deploy Functions to Firebase
```bash
firebase deploy --only functions
```

## Step 6: Set Firebase Functions Region (Optional)
If you want to specify a region closer to your users, edit `functions/index.js` and add region configuration:

```javascript
const {onRequest, onCall} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");

// Set global options for all functions
setGlobalOptions({region: "us-central1"}); // or your preferred region
```

## Step 7: Verify Functions Deployment
1. Go to Firebase Console → Functions
2. You should see 4 deployed functions:
   - `createAdminAccount`
   - `resetUserPassword`
   - `deleteUserAccount`
   - `getUserInfo`

## Step 8: Update Firebase Security Rules (Optional)
Make sure your Firestore rules allow admin operations:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow admins to read/write all user documents
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        resource.data.userType == 'admin';
    }
  }
}
```

## Function Capabilities

### 1. `createAdminAccount`
- Creates both Firebase Auth account and Firestore document
- Uses Admin SDK privileges (no session interference)
- Handles duplicate email validation
- Returns success confirmation with generated UIDs

### 2. `resetUserPassword`
- Resets password in both Firebase Auth and Firestore
- Updates password hash for consistency
- Admin session remains intact
- Instant password update (no email verification needed)

### 3. `deleteUserAccount`
- Deletes user from Firebase Auth completely
- Removes all Firestore documents (including pending accounts)
- Batch operations for efficiency
- Complete account removal

### 4. `getUserInfo`
- Retrieves user details from both Firebase Auth and Firestore
- Admin-only access for user management
- Useful for debugging and user verification

## Usage in React App

The functions are already integrated into your `UserManagement.jsx` component and will be called automatically when:
- Creating new admin accounts
- Resetting user passwords  
- Deleting user accounts

## Troubleshooting

### Function Not Found Error
If you get "Function not found" errors:
1. Check Firebase Console → Functions to confirm deployment
2. Verify function names match exactly in your React code
3. Ensure Firebase Functions are initialized in `firebase.js`

### Permission Denied
If you get permission errors:
1. Verify the calling user is authenticated as admin
2. Check Firestore security rules
3. Ensure Admin SDK is properly initialized in functions

### Deployment Issues
```bash
# Check function logs
firebase functions:log

# Redeploy specific function
firebase deploy --only functions:resetUserPassword

# Check function status
firebase functions:list
```

## Cost Considerations
- Cloud Functions have a generous free tier
- Each function call counts toward usage
- Admin operations are typically infrequent, so costs should be minimal
- Monitor usage in Firebase Console → Usage

## Security Benefits
✅ **True Admin Privileges**: Admin SDK bypasses client-side security restrictions
✅ **Session Preservation**: Admin stays logged in during user operations
✅ **Complete User Control**: Can reset passwords and delete accounts programmatically
✅ **Audit Trail**: All operations logged in Firebase Functions logs
✅ **No Client-Side Workarounds**: Proper server-side user management

Your SignTalk admin panel now has full programmatic control over user accounts without the limitations of client-side Firebase SDKs!