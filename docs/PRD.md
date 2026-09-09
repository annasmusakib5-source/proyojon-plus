
***Project Requirement Document (PRD)
Business Name:Proyojon Plus
Project Type: Multi-Level Marketing (MLM) E-commerce & Investment Platform
Business Model: Unilevel Generation Plan (Table View) with Multi-Package & Club Systems
Platform Architecture: Web-based (User Dashboard + Admin Control Panel)

1. User Account & Authentication Flow
Registration (Phone Number Only): Users will register using strictly their Phone Number and a Sponsor/Referral ID. There will be NO Email/Gmail input option during registration or login.

Password Recovery (Manual): There is no automated OTP or email-based password reset system. If a user clicks on "Forgot Password", they will be redirected to a "Contact Admin" page that clearly displays the Admin's official contact number. The Admin will manually verify and reset the password from the backend.

Account Activation: Accounts can be activated by purchasing a package or accumulating PV. Users can activate their ID purely with PV and adjust the monetary value later by purchasing physical products.

Multi-Package System: A single User ID can purchase all three types of packages (Customer, Shareholder, Gold) simultaneously.

Package Independence: If one package expires or is canceled, only the benefits tied to that specific package will stop. The user continues to enjoy the benefits of other active packages on the same ID.

2. Package Details & Core Business Logic
The system has 3 distinct joining packages. (1 Point / PV / SP / GP = 1 Taka)

A. Customer Package (1,000 PV)
Validity: 30 Days.

Reactivation Rule: After 30 days, the ID becomes inactive. To reactivate, the user must purchase products worth 100 PV (can be accumulated through retail purchases throughout the month).

Inactive Penalty: If the ID is inactive, no generation or referral income will be credited.

Generation/Referral Bonus (The 5% Rule): The moment a package is sold or purchased, a 5% generation bonus is triggered.

This is distributed as 1% per level up to 5 levels (1% x 5 Generations).

Crucial Logic: This 1% generation income does NOT go to the Current Balance. It is instantly credited exclusively to the Hajj Club (Hajj Fund) of the respective uplines.

B. Shareholder Package (5,000 SP)
Referral Commission: If a user sells this package, the referrer instantly receives 2.5% of the SP directly into their Current Balance.

Club Benefit: Only buyers of the Shareholder Package are eligible to receive the dividend from the "Shareholder Club".

Note: This package only triggers direct referral income based on SP; standard generation bonuses are distributed based on PV.

C. Gold Package (5,000 GP) - [Investment & ROI Logic]
Referral Commission (Drip-feed): The referrer gets a 1.8% commission. This is NOT paid instantly. It is divided by 365, and an equal portion is added to the referrer's Current Balance daily, as long as the package is active.

Buyer's Countdown Timer: A live countdown timer (365 Days, Hours, Minutes, Seconds) runs continuously on the header of the Gold Package buyer's dashboard.

Cancellation & Due Account Logic:

36% of 100,000 GP (which is 36,000) is divided by 365.

This daily calculated amount is added to a specific "Due Account" in the buyer's dashboard every day.

If the buyer decides to cancel their Gold Package, they must pay the accumulated amount in this "Due Account" to the Admin.

Upon cancellation, the daily drip-feed income of the referrer stops immediately.

3. Commission & Club Distribution System
The 100 PV Global Distribution (Triggered by Admin)
The Admin panel will display a list of all active Clubs and their eligible member counts. When the Admin clicks the "Distribute" button, funds generated from a 100 PV base will be automatically, instantly, and equally divided among eligible members according to the following exact percentages:

20% -> Daily Club

10% -> Shareholder Club (Distributed only among Shareholder Package buyers)

10% -> Hajj Club

7% -> Reward Point

5% -> Monthly Prize Point

5% -> Hajj Lottery Club

3% -> Salary Club

Salary Club Achievement
If a user successfully refers 15 Direct IDs containing the Customer Package (1000 PV), that user automatically becomes a verified member of the Salary Club.

4. User Dashboard UI & Features
No Tree View: The system will NOT have a graphical downline tree. The generation network (Level 1 to Level 5) will be displayed in a clear Table format.

Visible Wallets: The dashboard must clearly display the following wallets/blocks:

Current Balance

Total Income

Daily Club Bonus

Salary Club

Hajj Club / Hajj Fund

Shareholder Club

Hajj Lottery Club

Universal Club Visibility: Even if a user is not yet eligible for certain clubs, all club names and statuses will be visible on everyone's dashboard to encourage upgrades.

Fund Transfer: Users can transfer funds from their ID to another User's ID (ID-to-ID transfer).

Withdrawal System:

Users can request withdrawals directly to their Bank, bKash, Nagad, or Rocket accounts.

A flat 5% Withdrawal Charge applies to all cashout requests.

5. Admin Panel & Controls
Individual User Activity Report (Audit Log): The Admin dashboard will have a dedicated detailed report section for every individual user. The Admin can pull up any specific User ID and view their entire timeline of activities, including login history, package purchases, fund transfers, withdrawal requests, and club achievements.

User Management: The Admin has full control to view any user's ID/password, reset passwords manually, and lock/ban an ID.

Global Distribution Control: Admin controls the exact moment the 100 PV distribution percentages are executed via a single button click.

Manual Adjustments: Admin can manually award prizes or add balance directly to any user.

Dealer Commission: Admin can configure a separate 5% commission specifically for Dealers on physical products.

Withdrawal Management: Ability to securely view, approve, or reject user withdrawal requests.

Comprehensive System Reporting: Macro-level reports for Overall Sales, Total Withdrawals, Club Fund History, Active vs Inactive Users, and Due Account logs.

6. Recommended Technical Stack
Frontend Interface: Next.js (React Framework)

Provides a highly responsive, modern, and fast user interface for both the User Dashboard and Admin Panel. Supports Server-Side Rendering (SSR) for better performance.

Backend API & Logic: Express.js (Node.js)

Handles the complex MLM mathematical logic, RESTful API endpoints, routing, and real-time data processing efficiently.

Database Engine: MySQL (Relational Database)

Mandatory for structured financial data, ensuring strict ACID compliance, transaction rollbacks for secure fund transfers, and optimizing tabular generation JOIN queries.

Task Automation: Node-Cron (or similar scheduling tool in Express)

Essential for running automated daily background jobs (e.g., executing the Gold Package 365-day split payments, updating Due Accounts daily, and marking Customer IDs as inactive at midnight upon crossing 30 days).