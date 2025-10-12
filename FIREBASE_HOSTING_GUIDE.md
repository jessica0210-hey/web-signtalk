# Firebase Hosting Guide - Complete Setup

## Overview
This guide will help you deploy your React + Vite application to Firebase Hosting.

## Prerequisites
✅ Firebase project already exists (you're using Firebase Functions and Firestore)
✅ Firebase CLI should be installed
✅ `firebase.json` is already configured

## Current Configuration Status

### firebase.json (Already Configured ✅)
```json
{
  "hosting": {
    "public": "my-vite-app/dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

This configuration:
- Points to `my-vite-app/dist` as the public directory (where Vite builds your app)
- Includes rewrites for single-page application routing
- Ignores unnecessary files

---

## Step-by-Step Deployment Process

### Step 1: Install Firebase CLI (if not already installed)
```powershell
npm install -g firebase-tools
```

Verify installation:
```powershell
firebase --version
```

### Step 2: Login to Firebase
```powershell
firebase login
```

This will open a browser window for you to authenticate with your Google account.

### Step 3: Initialize Firebase Project (if not already done)
If you don't have a `.firebaserc` file, run:
```powershell
firebase use --add
```

Then select your Firebase project from the list and give it an alias (e.g., "default").

### Step 4: Build Your Vite Application
Navigate to your Vite app directory and build:
```powershell
cd my-vite-app
npm run build
```

This will create a `dist` folder with your optimized production files.

### Step 5: Test Locally (Optional but Recommended)
Before deploying, test your build locally:
```powershell
cd ..
firebase serve --only hosting
```

Open `http://localhost:5000` to preview your site.

### Step 6: Deploy to Firebase Hosting
From the root directory (`c:\Users\deibr\web-signtalk`):
```powershell
firebase deploy --only hosting
```

Or to deploy everything (hosting + functions):
```powershell
firebase deploy
```

---

## Quick Deployment Script

Add these scripts to your root `package.json` for easier deployment:

```json
{
  "scripts": {
    "build": "cd my-vite-app && npm run build",
    "deploy": "npm run build && firebase deploy --only hosting",
    "deploy:all": "npm run build && firebase deploy"
  }
}
```

Then you can simply run:
```powershell
npm run deploy
```

---

## Complete Command Sequence (First Time Setup)

Run these commands in order from the root directory:

```powershell
# 1. Install Firebase CLI (if not installed)
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Link to your Firebase project (if not already linked)
firebase use --add

# 4. Build your application
cd my-vite-app
npm run build
cd ..

# 5. Deploy to Firebase Hosting
firebase deploy --only hosting
```

---

## After Deployment

Once deployed, Firebase will provide you with:
- **Hosting URL**: `https://your-project-id.web.app`
- **Alternative URL**: `https://your-project-id.firebaseapp.com`

You can also set up a custom domain in the Firebase Console:
1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Follow the DNS configuration instructions

---

## Continuous Deployment

### Option 1: Manual Deployment
Every time you make changes:
```powershell
cd my-vite-app
npm run build
cd ..
firebase deploy --only hosting
```

### Option 2: GitHub Actions (Recommended for CI/CD)
Create `.github/workflows/firebase-hosting.yml` for automatic deployment on push.

---

## Important Notes

### 1. Environment Variables
Make sure your `firebase.js` configuration uses environment variables for production:
- Never commit API keys directly
- Use Vite's environment variables (`.env` files)
- Prefix with `VITE_` for Vite to include them in build

### 2. Build Optimization
Your Vite build is already optimized, but check:
- Minification is enabled
- Source maps for production (optional)
- Asset optimization

### 3. Caching
Firebase Hosting automatically caches static assets. To force refresh:
- The `index.html` is served with minimal cache
- JS/CSS files have cache-busting hashes in their filenames

### 4. Security Rules
Make sure your Firestore and Firebase Auth security rules are properly configured before going live.

---

## Troubleshooting

### Issue: "Cannot find module 'firebase.json'"
**Solution**: Make sure you're running commands from the root directory (`c:\Users\deibr\web-signtalk`)

### Issue: "No dist folder found"
**Solution**: Run `npm run build` in the `my-vite-app` directory first

### Issue: "Firebase project not initialized"
**Solution**: Run `firebase use --add` and select your project

### Issue: "Permission denied"
**Solution**: Run `firebase login` again to re-authenticate

### Issue: Blank page after deployment
**Solution**: 
- Check browser console for errors
- Verify Firebase config in `firebase.js`
- Ensure all routes use `BrowserRouter` from react-router-dom
- Check that rewrites are configured in `firebase.json` (already done ✅)

---

## Useful Firebase Hosting Commands

```powershell
# Check current project
firebase projects:list

# View hosting details
firebase hosting:channel:list

# Deploy to preview channel (test before production)
firebase hosting:channel:deploy preview

# View deployment history
firebase hosting:releases:list

# Rollback to previous version (in Firebase Console)
```

---

## Cost Considerations

Firebase Hosting Free Tier includes:
- 10 GB storage
- 360 MB/day transfer
- Free SSL certificate
- Free custom domain

This is typically sufficient for small to medium applications. Monitor usage in Firebase Console.

---

## Next Steps After Deployment

1. ✅ Test all features on the live site
2. ✅ Verify authentication works in production
3. ✅ Test all CRUD operations with Firestore
4. ✅ Check that Firebase Functions are accessible
5. ✅ Set up monitoring and analytics
6. ✅ Configure custom domain (if needed)
7. ✅ Set up error tracking (e.g., Sentry)
8. ✅ Enable performance monitoring in Firebase

---

## Date Created
October 11, 2025
