@echo off
title SAHABAT UTARA - Starting Application
color 0A

echo ==========================================
echo   SAHABAT UTARA
echo   Sistem Antisipasi Hadapi Banjir Terpadu
echo ==========================================
echo.

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js tidak ditemukan!
    echo Silakan install Node.js terlebih dahulu
    pause
    exit /b 1
)
echo OK - Node.js terinstall
echo.

echo [2/3] Installing Server dependencies...
cd server
call npm install >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    npm install
)
cd ..
echo OK
echo.

echo [3/3] Installing Client dependencies...
cd client
call npm install >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    npm install
)
cd ..
echo OK
echo.

echo ==========================================
echo   MEMULAI SERVER...
echo ==========================================
echo.
echo Backend Server: http://localhost:3001
echo Frontend Dev:   http://localhost:5173
echo.
echo Tekan Ctrl+C untuk menghentikan server
echo.

REM Start backend in new window
start "SAHABAT UTARA - Backend Server" cmd /k "cd server && npm run dev"

REM Wait a bit
timeout /t 3 /nobreak >nul

REM Start frontend
cd client && npm run dev
