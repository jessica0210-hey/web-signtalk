@echo off
echo ======================================
echo Firebase Hosting Deployment
echo ======================================
echo.

:: Build the application
echo Building application...
cd my-vite-app
call npm run build
if errorlevel 1 (
    echo Build failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo Build completed successfully!
echo.

:: Deploy to Firebase
echo Deploying to Firebase Hosting...
firebase deploy --only hosting
if errorlevel 1 (
    echo Deployment failed!
    pause
    exit /b 1
)

echo.
echo ======================================
echo Deployment Successful!
echo ======================================
pause
