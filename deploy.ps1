# Firebase Hosting Deployment Script
# Run this script to deploy your site

Write-Host "🚀 Starting Firebase Hosting Deployment Process..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if logged in to Firebase
Write-Host "Step 1: Checking Firebase authentication..." -ForegroundColor Yellow
$loginCheck = firebase projects:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Firebase. Running login..." -ForegroundColor Red
    firebase login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login failed. Please run 'firebase login' manually." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Already logged in to Firebase" -ForegroundColor Green
}
Write-Host ""

# Step 2: Check if project is initialized
Write-Host "Step 2: Checking Firebase project configuration..." -ForegroundColor Yellow
if (!(Test-Path .firebaserc)) {
    Write-Host "❌ Project not initialized. Please select your Firebase project:" -ForegroundColor Red
    firebase use --add
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Project initialization failed." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Firebase project is configured" -ForegroundColor Green
    $project = Get-Content .firebaserc | ConvertFrom-Json
    Write-Host "   Project: $($project.projects.default)" -ForegroundColor Gray
}
Write-Host ""

# Step 3: Build the application
Write-Host "Step 3: Building the application..." -ForegroundColor Yellow
Write-Host "   Running: npm run build in my-vite-app/" -ForegroundColor Gray
Set-Location my-vite-app
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Please check the errors above." -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "✅ Build completed successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Check if dist folder exists
Write-Host "Step 4: Verifying build output..." -ForegroundColor Yellow
if (!(Test-Path my-vite-app/dist)) {
    Write-Host "❌ Build output (dist folder) not found!" -ForegroundColor Red
    exit 1
}
$distSize = (Get-ChildItem my-vite-app/dist -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "✅ Build output verified ($([math]::Round($distSize, 2)) MB)" -ForegroundColor Green
Write-Host ""

# Step 5: Deploy to Firebase Hosting
Write-Host "Step 5: Deploying to Firebase Hosting..." -ForegroundColor Yellow
Write-Host "   This may take a minute..." -ForegroundColor Gray
firebase deploy --only hosting
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed. Please check the errors above." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Success message
Write-Host "🎉 ════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 Deployment Successful!" -ForegroundColor Green
Write-Host "🎉 ════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Your site is now live! 🚀" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Check your site at the URL shown above" -ForegroundColor White
Write-Host "  2. Test all features in production" -ForegroundColor White
Write-Host "  3. Monitor in Firebase Console: https://console.firebase.google.com" -ForegroundColor White
Write-Host ""
