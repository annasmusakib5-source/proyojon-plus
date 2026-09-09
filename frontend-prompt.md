# Proyojon Plus - Frontend Development Prompt Sheet

> **Context for the AI/Developer**: You are tasked with building the complete Frontend Application for **Proyojon Plus**, a highly professional Multi-Level Marketing (MLM) E-commerce & Investment Platform. The backend API is already 100% complete using Express.js and MySQL. Your job is to build a spectacular, high-performance, and premium web interface.

---

## 🎨 1. UI/UX & Design Philosophy (CRITICAL)
The design must evoke trust, premium investment, and financial professionalism. This is NOT a basic MVP. 
- **Aesthetics**: Sleek, modern financial dashboard look (think Stripe, Binance, or premium FinTech apps). Use Glassmorphism lightly, smooth gradients, and a curated color palette (e.g., Deep Navy Blue, Gold/Amber for premium packages, Emerald Green for success).
- **Core Design System**: Establish consistent design tokens in Tailwind (primary colors, typography, spacing, border-radius).
- **Typography**: Use modern fonts like `Inter`, `Plus Jakarta Sans`, or `Outfit`.
- **Micro-animations**: Add hover effects, smooth page transitions (Framer Motion), and loading skeletons. Buttons should feel tactile.
- **Responsiveness**: Mobile-first design is mandatory. The dashboard must look flawless on mobile screens.
- **Component Library**: Use **shadcn/ui** or **Aceternity UI** for highly polished, accessible, and customizable components.

---

## 🛠️ 2. Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: TailwindCSS + UI component library (shadcn/ui recommended)
- **State Management**: Zustand (for user session and wallet state)
- **Data Fetching**: Axios + TanStack Query (React Query) for caching and optimistic UI updates
- **Icons**: Lucide React
- **Authentication**: Handled via `HttpOnly` Cookies. 
  - *Note*: You must configure Axios with `withCredentials: true` globally so cookies are automatically sent with every request.

---

## 🔐 3. Authentication Flow
- **Login/Registration**: Phone Number and Password ONLY (No email inputs anywhere).
- **Registration**: Requires `phone`, `password`, and an optional `sponsor_id`.
- **Forgot Password**: There is NO automated OTP. If a user clicks "Forgot Password", redirect them to a beautifully designed "Contact Support" page displaying the Admin's official phone number to manually reset it.

---

## 📊 4. User Dashboard Requirements
The User Dashboard is the heart of the app. It must include the following views:

### A. Wallet Overview (The Core Dashboard)
- Beautiful metric cards displaying: `Current Balance`, `Total Income`, `Due Account`, and the 7 Club Balances (`Daily Club`, `Shareholder Club`, `Hajj Club`, `Reward Point`, `Monthly Prize`, `Hajj Lottery`, `Salary Club`).
- All 7 clubs must be visible to everyone to encourage upgrades, even if the user's balance is 0.

### B. Package Management
- Users can purchase 3 types of packages: **Customer (1000 PV)**, **Shareholder (5000 SP)**, **Gold (5000 GP)**.
- **Gold Package Special UI**: If a user has an active Gold Package, display a highly visible, live countdown timer (365 Days, Hours, Minutes, Seconds) at the top of their dashboard.

### C. Network View (Strict Table Format)
- **CRITICAL**: Do NOT build a graphical downline tree view. 
- Build a robust, paginated Data Table showing Level 1 to Level 5 generations. Include filters for levels. Columns: ID, Phone, Status, Joined Date.

### D. Financial Operations
- **Fund Transfer**: Form to send money (ID-to-ID). Requires `receiver_id` and `amount`.
- **Withdrawal**: Form to withdraw funds via Bank, bKash, Nagad, or Rocket. Show the 5% flat charge dynamically as they type the amount.

---

## 🛡️ 5. Admin Control Panel
A separate layout protected by role-based routing (Admin only).
- **User Audit**: A dedicated page where Admin can search a User ID and see their entire activity timeline (purchases, logins, transfers).
- **User Management**: View all users, ban/unban toggle, and a button to manually reset a user's password.
- **Global Distribution**: A critical action button (with a secure confirmation modal) that triggers the 100 PV distribution logic.
- **Withdrawal Management**: A table of pending requests with "Approve" and "Reject" actions. Rejection should allow adding an Admin Note.
- **System Reports**: Beautiful charts (Recharts) showing macro data: Total Sales by Package Type, Withdrawal stats, and Active vs Inactive user counts.

---

## 🔗 6. API Integration Guidelines
The backend runs locally on `http://localhost:5000/api`.
- Create an Axios instance setup:
  ```javascript
  import axios from 'axios';
  export const api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
      withCredentials: true, // Mandatory for HttpOnly Refresh/Access Tokens
  });
  ```
- **Error Handling**: The backend returns standardized errors. Catch `error.response.data.message` and display it beautifully using Toast notifications (e.g., Sonner or React Hot Toast).

---

> **Initial Task for the AI**: Begin by setting up the Next.js 14 project, configuring Tailwind + shadcn/ui, establishing the core color palette, and building the public Login/Registration pages with the required input restrictions. Do not proceed to the dashboard until the Auth UI is perfectly polished.
