# Codebase Walkthrough: How Prasan ERP was Built

This document explains every file in your project. As a non-coder, you can use this as a reference to understand "what does this file do?" and "how was it made?".

---

## 🛠️ Category 1: The "Foundation" (Automated)
These files were created using a single terminal command: `npx create-next-app`. They provide the basic skeleton of the website.

| File Name | Purpose |
| :--- | :--- |
| `package.json` | The "Recipe Book." It lists every tool (library) the app uses. |
| `tsconfig.json` | Rules for how the computer reads the code (TypeScript configurations). |
| `next.config.ts` | Special settings for the Next.js website engine. |
| `.gitignore` | Tells GitHub which files to ignore (like private passwords or temporary files). |
| `node_modules/` | A folder containing thousands of small tools downloaded from the internet. |

---

## 🎨 Category 2: UI Components (Semi-Automated)
These are files for buttons, text boxes, and menus. They were created using the command: `npx shadcn-ui@latest add [component-name]`.

| Folder/File | Purpose |
| :--- | :--- |
| `src/components/ui/` | Contains the "UI Building Blocks" like `button.tsx`, `input.tsx`, `dialog.tsx`. |
| `src/app/globals.css` | The "Styling Sheet" that defines colors, fonts, and the dark-mode theme. |

---

## 🧠 Category 3: The "Business Brain" (Hand-Written by AI)
These files were created by "typing" code (via AI) in our conversations. They contain the actual logic for your invoices and accounts.

### 1. The Database (`prisma/`)
*   **File:** `schema.prisma`
*   **Purpose:** The blue-print for your database. It defines what an "Invoice" or "Customer" looks like.
*   **Command used:** `npx prisma db push` (This command actually creates the `dev.db` file based on this blueprint).

### 2. The Logic (`src/app/actions.ts`)
*   **Purpose:** This is the "Backend." It handles saving an invoice, deleting a customer, or calculating balances. 
*   **How it works:** When you click "Save," this file talks to the database.

### 3. The Pages (`src/components/`)
These are the actual screens you see in your browser.
*   `accounts-page.tsx`: Your Customer/Agent management screen.
*   `invoices-page.tsx`: The Invoice generator and PDF exporter.
*   `settings-page.tsx`: The Business management and Password settings.
*   `dashboard-page.tsx`: The home screen with overview charts.

### 4. The Store (`src/lib/store.tsx`)
*   **Purpose:** The "Short-term Memory." It keeps track of which company you currently have open so that when you switch pages, the app doesn't forget who you are.

---

## 🔑 Category 4: The "Launchers" (Custom Scripts)
These were created to make it easy for you and your father to start the app.

*   `start-windows.bat`: For your father's Windows laptop. It checks if the database exists and starts the server.
*   `start-mac.command`: For your Mac. Does the same thing.

---

## ⌨️ List of Essential Terminal Commands
In case you ever need to manually fix things, these are the commands that were used:

1.  `npm run dev`: Starts the application in "Developer Mode" so you can see it in Chrome.
2.  `npm install`: Downloads all the tools listed in `package.json`.
3.  `npx prisma db push`: Synchronizes your database blueprint with the actual `dev.db` file.
4.  `npx prisma generate`: Re-builds the connection between the code and the database.

---

## 💡 Summary for Non-Coders
Think of the app like a **Restaurant**:
*   **Next.js (`app/`)**: The Building.
*   **Database (`dev.db`)**: The Storage Room with all the supplies.
*   **Actions (`actions.ts`)**: The Chefs in the kitchen preparing the data.
*   **Components (`src/components/`)**: The Menu and the Tables where you interact.
*   **Terminal Commands**: The instructions on how to turn the lights on and start the kitchen.
