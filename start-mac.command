#!/bin/bash
# Prasan ERP — macOS Launcher
# Double-click this file to start the application

cd "$(dirname "$0")"

echo "╔══════════════════════════════════════╗"
echo "║       Prasan ERP — Starting...       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "   Please install it from: https://nodejs.org"
    echo ""
    echo "   Press any key to exit..."
    read -n 1
    exit 1
fi

echo "✓ Node.js found: $(node -v)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies (first time only)..."
    npm install
fi

# Push database schema if needed
if [ ! -f "dev.db" ]; then
    echo "🗄️  Setting up database..."
    npx prisma generate
    npx prisma db push
fi

echo ""
echo "🚀 Starting Prasan ERP..."
echo "   Opening in your browser at http://localhost:3000"
echo "   Press Ctrl+C to stop the server."
echo ""

# Open browser after a short delay
(sleep 3 && open http://localhost:3000) &

# Start the dev server
npm run dev
