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
    echo --------------------------------------------------
    echo TIP: If you just installed Node.js, please restart
    echo      the laptop and try again.
    echo --------------------------------------------------
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do echo [OK] Node.js found: %%v

:: TIP IF COPIED FROM MAC
if exist "node_modules\.bin\next" (
    :: Basic check to see if node_modules might be from a different OS
    :: On Windows, next is usually next.cmd
)

:: Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing dependencies (first time only)...
    echo        This may take a few minutes.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install dependencies.
        echo         Please check your internet connection.
        pause
        exit /b 1
    )
)

:: Push database schema if needed
if not exist "dev.db" (
    echo [INFO] Setting up database...
    call npx prisma generate
    call npx prisma db push
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Database setup failed.
        pause
        exit /b 1
    )
)

echo.
echo [STARTING] Prasan ERP at http://localhost:3000
echo            Press Ctrl+C to stop the server.
echo.

:: Open browser after delay
start "" /b cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:3000"

:: Start the dev server
call npm run dev
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] The server stopped unexpectedly.
    echo         Common reasons:
    echo         1. Port 3000 is already in use by another app.
    echo         2. node_modules was copied from a Mac (delete it and retry).
    echo.
    pause
)
