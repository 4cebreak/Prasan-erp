@echo off
title Prasan ERP
cd /d "%~dp0"

echo ======================================
echo        Prasan ERP - Starting...
echo ======================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo         Please install it from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do echo [OK] Node.js found: %%v

:: Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing dependencies (first time only)...
    call npm install
)

:: Push database schema if needed
if not exist "dev.db" (
    echo [INFO] Setting up database...
    call npx prisma generate
    call npx prisma db push
)

echo.
echo [STARTING] Prasan ERP at http://localhost:3000
echo            Press Ctrl+C to stop the server.
echo.

:: Open browser after delay
start "" /b cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: Start the dev server
call npm run dev
