@echo off
title Sabre Training Simulator - Desktop
setlocal

REM =========================================================
REM   SABRE TRAINING SIMULATOR — DESKTOP LAUNCHER
REM   Powered by Electron | Wings Fly Aviation Academy
REM =========================================================

cd /d "%~dp0"

REM Check if node_modules/electron exists
if not exist "node_modules\electron\dist\electron.exe" (
    echo [SETUP] Electron not found. Installing dependencies...
    call npm install --prefer-offline --no-audit --no-fund
    if errorlevel 1 (
        echo [ERROR] npm install failed. Please run: npm install
        pause
        exit /b 1
    )
)

echo.
echo =========================================================
echo    Sabre GDS Training Simulator - Desktop Mode
echo    Wings Fly Aviation Academy
echo =========================================================
echo.
echo    Starting Electron desktop window...
echo.

REM Launch Electron silently (no extra console)
start "" "node_modules\electron\dist\electron.exe" "."

REM Wait briefly for window to open, then exit console
timeout /t 2 /nobreak >nul
exit
