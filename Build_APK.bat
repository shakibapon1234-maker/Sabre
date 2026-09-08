@echo off
setlocal
title Sabre Training Simulator - Build APK
cd /d "%~dp0"

echo ============================================
echo   Sabre Training Simulator - APK Builder
echo ============================================
echo.

echo [1/3] Syncing web assets into Android project...
if not exist "android\app\src\main\assets\www" mkdir "android\app\src\main\assets\www"
xcopy /Y /E /I "index.html" "android\app\src\main\assets\www\" >nul
xcopy /Y /E /I "js" "android\app\src\main\assets\www\js\" >nul
echo     Done.
echo.

echo [2/3] Building release APK with Gradle...
cd android
call gradlew.bat assembleRelease
if errorlevel 1 (
    echo.
    echo Build FAILED. See the Gradle output above.
    pause
    exit /b 1
)
cd ..
echo.

echo [3/3] Locating output APK...
set APK_PATH=android\app\build\outputs\apk\release\app-release.apk
if exist "%APK_PATH%" (
    echo.
    echo ============================================
    echo   Build succeeded:
    echo   %APK_PATH%
    echo ============================================
) else (
    echo Build finished but APK was not found at the expected path.
)

echo.
pause
