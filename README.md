# Prasan ERP

A professional business suite for jeans manufacturing — accounting, invoicing, CRM, and ledger management.

## Features

- 🏢 **Multi-Company** — Manage unlimited business entities with isolated data
- 📊 **Dashboard** — Real-time revenue, accounts, and invoice analytics
- 🧾 **Invoicing** — Create, track, and export invoices with aging indicators
- 📒 **Ledger Management** — Full double-entry ledger with PDF export
- 🔒 **Password Protected** — SHA-256 hashed master password
- 🗄️ **SQLite Database** — Permanent local storage via Prisma ORM

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) v18 or later

### Option A: Double-Click Launch

- **macOS**: Double-click `start-mac.command`
- **Windows**: Double-click `start-windows.bat`

### Option B: Manual

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Troubleshooting

### Windows Users (Folder copied from Mac)

If you received this project folder from a Mac user, the `node_modules` folder will not work on Windows and will cause the terminal to close immediately.

**Fix:**

1. Delete the `node_modules` folder entirely.
2. Run `start-windows.bat` again. It will automatically download the correct Windows version.
3. If Node.js was just installed, please restart your laptop first.

## First Launch

On first launch, a **Setup Wizard** will guide you through:

1. Setting your **Company Name**
2. Creating a **Master Password**

After setup, use the password to log in on subsequent visits.

## Tech Stack

- **Framework**: Next.js 16 (Turbopack)
- **Database**: SQLite via Prisma ORM
- **Auth**: Client-side SHA-256 password hashing
- **UI**: shadcn/ui + Tailwind CSS

## Project Structure

```
├── prisma/schema.prisma    # Database schema
├── src/app/actions.ts      # Server Actions (CRUD)
├── src/lib/auth.tsx        # Auth + Setup Wizard
├── src/lib/store.tsx       # Global state (SQLite-backed)
├── src/lib/prisma.ts       # Database connection singleton
├── src/components/         # UI components
├── start-mac.command       # macOS launcher
├── start-windows.bat       # Windows launcher
└── dev.db                  # SQLite database (auto-created)
```

## License

Private — All rights reserved.
