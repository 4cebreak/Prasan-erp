# Prasan ERP - SaaS Expansion Roadmap

This document outlines the strategic and technical plan to transform **Prasan ERP** into a multi-tenant Software-as-a-Service (SaaS) product. This will allow you to offer the ERP to other businesses as a subscription-based service.

---

## 🏛️ Phase 1: Cloud Foundation & Landing Page
The current app runs locally on a single computer using a file-based database (`dev.db`). To become a SaaS, we must move everything to the cloud.

### 1. High-Conversion Landing Page
First impressions matter. We will build a professional public website (Homepage) that includes:
*   **Hero Section:** A powerful headline and a screenshot of the dashboard.
*   **Navigation Bar:** Links to *Features*, *Pricing*, and *About Us*.
*   **Auth Buttons:** "Login" and "Sign Up" prominently in the top right.
*   **Pricing Page:** Showing Basic ($29) and Pro ($49) plans.
*   **About Page:** Explaining the mission behind Prasan ERP and your business.
*   **Features Section:** Using the screenshots we collected to show the app in action.

### 2. Centralized Database (Moving to PostgreSQL)
Instead of every user having their own `dev.db` file, we will use a single, powerful cloud database (like **Supabase** or **Neon**).
*   **How it works:** A single database holds data for ALL companies. Every record (invoice, account, etc.) will have a `tenantId` (Company ID) attached to it to ensure users only see their own data.
*   **Estimated Cost:** $0 (Free Tier) to $25/month for high performance.

### 2. Multi-Tenant Architecture
We will modify the application logic so that when a user logs in, the app automatically filters all data based on their "Organization ID."
*   **Security:** This is critical. We will implement "Row Level Security" (RLS), which is like a digital wall that prevents User A from ever accidentally seeing User B’s data.

---

## 🔐 Phase 2: Professional Identity & Admin Control
A SaaS requires individual user accounts and a "Master Dashboard" for you.

### 1. Robust Login (Email, Google, Passwordless)
We will integrate a service like **Clerk** or **NextAuth.js**.
*   **Features:**
    *   **Google Login:** One-click login for users.
    *   **Email Verification:** Ensures users provide a real email.
    *   **Password Reset:** Automated "Forgot Password" flows via email.

### 2. The Super-Admin Panel (For You Only)
You need a "God View" of the entire system. We will build a private dashboard accessible only by your email.
*   **Company Overview:** List of all registered companies.
*   **Subscription Status:** See who is on Free vs. Pro plans.
*   **Usage Stats:** How many invoices are being generated across the platform.
*   **User Support:** Ability to reset passwords or help users with their accounts.
*   **Estimated Cost:** $0 (Free up to 10,000 users).

### 2. Team Management & Roles
Allow a business owner to invite their staff to the product.
*   **Admin:** Full access.
*   **Staff:** Can create invoices but cannot delete organizations.
*   **Accountant:** Read-only access to ledgers.

---

## 💳 Phase 3: Monetization & Subscriptions
To make money, we need to handle payments and restrict features based on tiers.

### 1. Stripe Integration
The gold standard for online payments.
*   **Billing Cycles:** Monthly ($29/mo) or Yearly ($250/yr) billing.
*   **Tiers:**
    *   **Basic:** 1 Company, up to 100 invoices.
    *   **Pro:** Unlimited Companies, unlimited invoices, PDF branding.
*   **Estimated Cost:** Stripe takes ~2.9% + 30¢ per transaction.

---

## 🚀 Phase 4: Production Deployment
Moving from "running on your laptop" to "running on the web."

### 1. Vercel Hosting
We will deploy the app to **Vercel**. Your ERP will be accessible at a custom domain like `app.prasan-erp.com`.
*   **Estimated Cost:** $20/month for a Pro account (required for commercial use).

---

## 💰 Total Estimated Project Cost Breakdown

| Component | Service Recommendation | Monthly Cost (Est.) | Annual Cost (Est.) |
| :--- | :--- | :--- | :--- |
| **Hosting** | Vercel (Pro) | $20 | $240 |
| **Database** | Supabase (Pro) | $25 | $300 |
| **Auth** | Clerk | $0 (Free Tier) | $0 |
| **Email Service** | Resend | $0 - $10 | $120 |
| **Domain** | Namecheap/GoDaddy | - | $15 |
| **AI Dev Credits** | Antigravity Usage | ~$10 - $30 | - |
| **TOTAL** | | **~$60/mo** | **~$700/yr** |

> [!TIP]
> **Why this is a good investment:** 
> With just 3 customers paying $29/month, the entire platform pays for itself. Every customer after that is pure profit.

---

## 🛠️ Local Development & Future Roadmap
Since you are still implementing many features locally, our workflow will be:
1.  **Local First:** Build and polish new invoice features, inventory, or payroll on your Mac.
2.  **Staging:** Deploy updates to a private test website.
3.  **Production:** Push the final version to your SaaS users.

> [!NOTE]
> This plan is a living document. As you add more local features (like GST or Inventory), we will update the database blueprint to support them in the cloud.

---

## 📅 Next Steps
If you choose to proceed, our first task will be creating a **Supabase** account and connecting the ERP to a cloud database. This will make your data accessible from anywhere in the world instantly.
