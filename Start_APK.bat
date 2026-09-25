@echo off
setlocal
title Sabre Training Simulator - Start APK
cd /d "%~dp0"

set APK_PATH=android\app\build\outputs\apk\release\app-release.apk
set ADB=adb
if not defined ANDROID_HOME if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
if exist "%ANDROID_HOME%\platform-tools\adb.exe" set "ADB=%ANDROID_HOME%\platform-tools\adb.exe"

if not exist "%APK_PATH%" (
    echo APK not found at %APK_PATH%
    echo Run Build_APK.bat first.
    echo.
    pause
    exit /b 1
)

echo Installing on connected device/emulator...
"%ADB%" install -r "%APK_PATH%"
if errorlevel 1 (
    echo.
    echo Install failed. Make sure a device is connected and USB debugging is on.
    pause
    exit /b 1
)

echo Launching...
"%ADB%" shell am start -n com.sabre.training/.MainActivity

echo.
pause
