# 🚀 Quick Deployment Guide

## TL;DR - Deploy in 3 Steps

### Method 1: Using PowerShell Script (Recommended)
```powershell
.\deploy.ps1
```

### Method 2: Using Batch File
```cmd
deploy.bat
```

### Method 3: Using NPM Scripts
```powershell
npm run deploy
```

### Method 4: Manual Commands
```powershell
cd my-vite-app
npm run build
cd ..
firebase deploy --only hosting
```

---

## First Time Setup (One-Time Only)

### 1. Make sure you're logged in to Firebase:
```powershell
firebase login
```

### 2. Link to your Firebase project:
```powershell
firebase use --add
```
- Select your project from the list
- Give it an alias (e.g., "default")

### 3. Done! Now you can deploy using any method above.

---

## Available NPM Scripts

From the root directory:

```powershell
# Install all dependencies (my-vite-app + functions)
npm run install:all

# Build the application
npm run build

# Run development server
npm run dev

# Deploy hosting only (builds first)
npm run deploy

# Deploy everything (hosting + functions)
npm run deploy:all

# Deploy only functions
npm run deploy:functions

# Test locally before deploying
npm run serve

# View function logs
npm run logs
```

---

## What Happens During Deployment?

1. ✅ **Build** - Vite compiles your React app into optimized static files
   - Output goes to `my-vite-app/dist/`
   - Minifies JavaScript and CSS
   - Optimizes images and assets
   - Creates cache-busting filenames

2. ✅ **Deploy** - Firebase uploads your files to their CDN
   - Uploads all files from `my-vite-app/dist/`
   - Configures routing for SPA
   - Enables SSL/HTTPS automatically
   - Distributes globally

3. ✅ **Live** - Your site is accessible worldwide
   - URL: `https://your-project-id.web.app`
   - Alt URL: `https://your-project-id.firebaseapp.com`

---

## Deployment Checklist

Before deploying to production:

- [ ] Test all features locally (`npm run dev`)
- [ ] Check that all environment variables are set correctly
- [ ] Verify Firebase security rules are configured
- [ ] Build succeeds without errors (`npm run build`)
- [ ] Test the built version locally (`npm run serve`)
- [ ] Review changes in git (optional but recommended)
- [ ] Deploy! (`npm run deploy`)
- [ ] Test the live site
- [ ] Verify authentication works
- [ ] Check all routes/pages load correctly

---

## Troubleshooting

### ❌ "firebase: command not found"
**Solution:** Install Firebase CLI
```powershell
npm install -g firebase-tools
```

### ❌ "Error: Not logged in"
**Solution:** Login to Firebase
```powershell
firebase login
```

### ❌ "No project active"
**Solution:** Link to your project
```powershell
firebase use --add
```

### ❌ "Build failed"
**Solution:** 
- Check for syntax errors in your code
- Run `npm install` in my-vite-app directory
- Check the error message for specifics

### ❌ "Blank page after deployment"
**Solution:**
- Open browser console and check for errors
- Verify Firebase config in `src/firebase.js`
- Check that all routes use proper paths
- Clear browser cache and try again

### ❌ "Authentication not working"
**Solution:**
- Add your hosting domain to Firebase Console:
  - Go to Authentication → Settings → Authorized domains
  - Add your `.web.app` and `.firebaseapp.com` domains

---

## Useful Commands

```powershell
# Check current Firebase project
firebase projects:list

# View deployment history
firebase hosting:releases:list

# Deploy to a preview channel (test before production)
firebase hosting:channel:deploy preview

# Switch between Firebase projects
firebase use [project-id]

# View real-time logs
firebase functions:log --only hosting

# Clear hosting cache
firebase hosting:cache:clear
```

---

## File Structure Reference

```
web-signtalk/
├── firebase.json          ← Hosting configuration
├── .firebaserc            ← Project configuration (created after 'firebase use')
├── package.json           ← Root deployment scripts
├── deploy.ps1            ← PowerShell deployment script
├── deploy.bat            ← Batch deployment script
├── my-vite-app/
│   ├── dist/             ← Build output (created after 'npm run build')
│   │   └── index.html
│   │   └── assets/
│   ├── src/
│   └── package.json
└── functions/
    └── index.js
```

---

## Production URLs

After deployment, your site will be available at:
- **Primary:** `https://[your-project-id].web.app`
- **Alternative:** `https://[your-project-id].firebaseapp.com`

Check your Firebase Console → Hosting to see the exact URLs.

---

## Need Help?

- 📚 Full guide: `FIREBASE_HOSTING_GUIDE.md`
- 🔥 Firebase Console: https://console.firebase.google.com
- 📖 Firebase Docs: https://firebase.google.com/docs/hosting

---

**Created:** October 11, 2025
