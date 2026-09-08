@echo off
setlocal
title Sabre Training Simulator
cd /d "%~dp0"

if not exist "index.html" (
    echo [ERROR] Sabre project files were not found.
    pause
    exit /b 1
)

if exist "node_modules\electron\dist\electron.exe" (
    call "Start_Desktop.bat"
    exit /b %errorlevel%
)

echo Electron is not installed yet. Installing dependencies...
call npm.cmd install --prefer-offline --no-audit --no-fund
if errorlevel 1 (
    echo [ERROR] npm install failed. Please check your internet connection and Node.js installation.
    pause
    exit /b 1
)

call "Start_Desktop.bat"
