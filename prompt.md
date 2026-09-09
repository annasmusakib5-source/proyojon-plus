# 🔍 Proyojon Plus Backend — Gap Analysis & Step-by-Step Completion Prompts

## Summary: আপনার Backend কতটুকু Complete?

| ক্যাটাগরি | PRD অনুযায়ী মোট | ✅ Done | ❌ Remaining |
|---|---|---|---|
| **Database Schema (Prisma)** | 10 tables | 8 | 2 |
| **Auth APIs (1.0)** | 4 sub-processes | 2 | 2 |
| **Package & Commission (2.0)** | 6 sub-processes | 0 | 6 |
| **Club Distribution (3.0)** | 2 sub-processes | 0 | 2 |
| **Wallet & Transaction (4.0)** | 3 sub-processes | 2 (partial) | 2 |
| **Admin Control (5.0)** | 6 sub-processes | 0 | 6 |
| **Background Cron Jobs (6.0)** | 4 jobs | 1 | 3 |
| **Middlewares** | 6 middlewares | 2 | 4 |
| **Overall Backend Completion** | — | **~15%** | **~85%** |

> [!CAUTION]
> ব্যাকএন্ডের সবচেয়ে গুরুত্বপূর্ণ অংশগুলো — Package Purchase, Commission Distribution, Club System, Admin Panel, Fund Transfer — এখনো তৈরি হয়নি। নিচে ধাপে ধাপে সবকিছু তৈরির জন্য prompt দেওয়া হলো।

---

## 🗄️ PART 1: Missing Database Tables (Prisma Schema)

### ❌ Missing Table 1: `fund_transfers` (architecture.md §4.6 / DFT D9)

```
Prompt 1:
```
> Add a new Prisma model called `FundTransfer` to `prisma/schema.prisma` (mapped to `fund_transfers` table). It should have: `id` (Int, PK, auto-increment), `senderId` (Int, FK → User), `receiverId` (Int, FK → User), `amount` (Decimal 15,2), and `createdAt` (DateTime, default now). Add relations back to User model (sender and receiver) and add indexes on senderId and receiverId. Also update the User model to add the reverse relations `sentTransfers` and `receivedTransfers`.

---

### ❌ Missing Table 2: `club_memberships` (architecture.md §4.7 / DFT D6)

```
Prompt 2:
```
> Add a new Prisma model called `ClubMembership` to `prisma/schema.prisma` (mapped to `club_memberships` table). It should have: `id` (Int, PK, auto-increment), `userId` (Int, FK → User), `clubType` (Enum: 'daily', 'shareholder', 'hajj', 'hajj_lottery', 'salary', 'reward', 'monthly_prize'), `isEligible` (Boolean, default true), `joinedAt` (DateTime, default now). Add a new enum `ClubType` and add @@unique([userId, clubType]) constraint. Also add the reverse relation `clubMemberships ClubMembership[]` to the User model.

---

### ❌ Missing Table 3: `club_distribution_history` (architecture.md §4.8 / DFT D7)

```
Prompt 3:
```
> Add a new Prisma model called `ClubDistributionHistory` to `prisma/schema.prisma` (mapped to `club_distribution_history` table). It should have: `id`, `triggeredBy` (Int, FK → User, the admin who triggered), `totalPvDistributed` (Decimal), `dailyClubAmount` (Decimal, 20%), `shareholderClubAmount` (Decimal, 10%), `hajjClubAmount` (Decimal, 10%), `rewardPointAmount` (Decimal, 7%), `monthlyPrizeAmount` (Decimal, 5%), `hajjLotteryAmount` (Decimal, 5%), `salaryClubAmount` (Decimal, 3%), `eligibleMemberCounts` (Json), `createdAt` (DateTime). Add relation to User model.

---

### ⚠️ Existing Schema Issues to Fix

```
Prompt 4:
```
> Update the existing Prisma schema to fix these issues from the architecture.md:
> 1. **Users table**: Add `isDealer Boolean @default(false) @map("is_dealer")` field.
> 2. **Withdrawals table**: Add `adminNote String? @map("admin_note") @db.Text` and split `accountDetails` into `accountNumber String @map("account_number") @db.VarChar(50)` and `accountHolderName String @map("account_holder_name") @db.VarChar(100)`.
> 3. **UserPackage table**: Add `monthlyAccumulatedPv Int @default(0) @map("monthly_accumulated_pv")` and `countdownEndDate DateTime? @map("countdown_end_date")` fields for Customer reactivation tracking and Gold 365-day timer.
> 4. **Transaction table**: Add `walletField String? @map("wallet_field") @db.VarChar(50)` to track which wallet field was affected.
> After changes, run `npx prisma migrate dev --name add_missing_fields` to apply.

---

## 🔐 PART 2: Auth System Completion (Process 1.0)

### ✅ 1.1 Register User — DONE ✅
### ✅ 1.2 Login User — DONE ✅

### ❌ 1.3 Forgot Password — "Contact Admin" Page

```
Prompt 5:
```
> Write an Express.js route (GET /api/auth/forgot-password) that simply returns a JSON response with the Admin's contact phone number. There is NO OTP or automated reset — the user must contact Admin directly. Read the ADMIN_CONTACT_PHONE from .env. Add this to `ADMIN_CONTACT_PHONE=01XXXXXXXXX` in .env file. Add the route to `routes/authRoutes.js`.

---

### ❌ 1.4 Admin Reset Password

```
Prompt 6:
```
> Write an Express.js route (PUT /api/admin/users/:id/reset-password) protected by `authenticateUser` and `authorizeAdmin` middleware. It should accept `new_password` in the request body, hash it with bcrypt (salt rounds 12), update the user's password in the `users` table, log the action in `user_activity_logs` with action='PASSWORD_RESET', and return a success response. Create this in `controllers/adminController.js` and `routes/adminRoutes.js`.

---

## 📦 PART 3: Package & Commission System (Process 2.0) — FULLY MISSING

### ❌ 2.1 + 2.2 Package Purchase & Activation

```
Prompt 7:
```
> Write an Express.js route (POST /api/packages/purchase) protected by auth middleware. Based on the PRD and DFT:
> 1. Accept `package_type` ('customer', 'shareholder', 'gold') from request body.
> 2. Validate that the user does NOT already have an active package of the SAME type (but can have all 3 different types active simultaneously — PRD §1 Multi-Package System).
> 3. Check if user has sufficient `current_balance` in wallets to pay the package price (Customer=1000, Shareholder=5000, Gold=5000).
> 4. Inside a MySQL transaction with FOR UPDATE row lock:
>    - Deduct amount from wallet's `current_balance`.
>    - Insert a row in `user_packages` with `activated_at=NOW()`, `expires_at` (Customer: +30 days, Gold: +365 days, Shareholder: NULL).
>    - If this is the user's FIRST package purchase, update `users.status` to 'active'.
>    - Log in `transactions` table with category='deposit'.
>    - Log in `user_activity_logs` with action='PACKAGE_PURCHASE'.
> 5. After successful purchase, trigger the 5% Generation Bonus (sub-process 2.3).
> 6. If Shareholder, also trigger the 2.5% referral commission (sub-process 2.4).
> Create `controllers/packageController.js` and `routes/packageRoutes.js`. Register in `server.js`.

---

### ❌ 2.3 Distribute 5% Generation Bonus (1% × 5 Levels → Hajj Club ONLY)

```
Prompt 8:
```
> Write a reusable function `distributeGenerationBonus(connection, buyerUserId, pvAmount)` in a new file `services/commissionService.js`. Based on PRD §2A:
> 1. Traverse 5 sponsor levels upward by following `users.sponsor_id` chain.
> 2. For each level (1 to 5), calculate 1% of the PV amount.
> 3. **CRUCIAL**: Credit this amount to the upline's `hajj_club` field in `wallets` — NOT to `current_balance`. This is explicitly stated in the PRD.
> 4. Skip any upline who is inactive or banned.
> 5. Log each credit as a `transaction` with `category='generation_bonus'`, `type='credit'`, `wallet_field='hajj_club'`.
> 6. The function should accept a MySQL connection (to be called inside an existing transaction).
> This function will be called from the Package Purchase controller after each package sale.

---

### ❌ 2.4 Shareholder 2.5% Instant Referral Commission

```
Prompt 9:
```
> Write a reusable function `distributeShareholderReferral(connection, buyerUserId, spAmount)` in `services/commissionService.js`. Based on PRD §2B:
> 1. Find the buyer's direct sponsor via `users.sponsor_id`.
> 2. If sponsor exists AND is active, credit 2.5% of SP amount to their `current_balance` in wallets.
> 3. Also increase the sponsor's `total_income` by the same amount.
> 4. Log as a `transaction` with `category='referral_bonus'`, `type='credit'`, `wallet_field='current_balance'`.
> This function will be called from the Package Purchase controller when a Shareholder Package is bought.

---

### ❌ 2.5 Gold Referral Commission Setup (Daily Drip)
*Note: The Gold ROI cron job already exists and handles the daily distribution. No additional setup route is needed — the cron reads active Gold packages and auto-distributes. ✅ Covered by existing `goldDailyROI.job.js`.*

---

### ❌ 2.6 Gold Package Cancellation

```
Prompt 10:
```
> Write an Express.js route (POST /api/packages/:id/cancel) protected by auth middleware. Based on PRD §2C:
> 1. Validate the `id` parameter refers to a `user_packages` row owned by the logged-in user AND the package is a Gold type AND status is 'active'.
> 2. Fetch the user's `due_account` from `wallets`.
> 3. Check if the user has enough `current_balance` to pay off the accumulated `due_account`.
> 4. Inside a transaction:
>    - Deduct `due_account` amount from `current_balance`.
>    - Reset `due_account` to 0.
>    - Set `user_packages.status = 'canceled'`.
>    - Log transaction with `category='due_account_penalty'`.
>    - Log in `user_activity_logs` with action='GOLD_CANCELLATION'.
> 5. Once canceled, the Gold Daily Drip cron job will automatically skip this package since it only processes status='active'.
> Add this route to `routes/packageRoutes.js`.

---

### ❌ View User's Packages

```
Prompt 11:
```
> Write an Express.js route (GET /api/packages) protected by auth middleware. It should fetch all packages for the logged-in user from `user_packages` joined with `packages` table, showing package name, price, status, activated_at, expires_at, countdown_end_date, and monthly_accumulated_pv. Add to `controllers/packageController.js` and `routes/packageRoutes.js`.

---

## 🏆 PART 4: Club Distribution System (Process 3.0) — FULLY MISSING

### ❌ 3.1 Preview Distribution (Admin)

```
Prompt 12:
```
> Write an Express.js route (GET /api/admin/distribution/preview) protected by auth + admin middleware. Based on PRD §3:
> 1. Count eligible members for each of the 7 clubs:
>    - **Daily Club**: All active users (any package active).
>    - **Shareholder Club**: Only users with active Shareholder Package.
>    - **Hajj Club**: All active users.
>    - **Reward Point**: All active users.
>    - **Monthly Prize Point**: All active users.
>    - **Hajj Lottery Club**: All active users.
>    - **Salary Club**: Users with ≥15 direct referrals who have active Customer Packages (check `club_memberships` table).
> 2. Return the counts per club so Admin can preview before triggering.
> Create `controllers/adminDistributionController.js` and `routes/adminRoutes.js`.

---

### ❌ 3.2 Execute Distribution (Admin)

```
Prompt 13:
```
> Write an Express.js route (POST /api/admin/distribution/trigger) protected by auth + admin middleware. Based on PRD §3:
> 1. Accept `base_pv` (default 100) from request body.
> 2. Calculate the 7 club portions: 20% Daily, 10% Shareholder, 10% Hajj, 7% Reward, 5% Monthly Prize, 5% Hajj Lottery, 3% Salary.
> 3. For each club, fetch all eligible members and divide the club portion equally.
> 4. Inside a single MySQL transaction:
>    - Credit each member's respective wallet field (e.g., daily_club_bonus, shareholder_club, hajj_club, etc.).
>    - Insert transaction log for each member with `category='club_bonus'`.
>    - Insert a record in `club_distribution_history` with all amounts and member counts.
> 5. Return a summary response.
> Add to `controllers/adminDistributionController.js`.

---

### ❌ Distribution History

```
Prompt 14:
```
> Write an Express.js route (GET /api/admin/distribution/history) protected by auth + admin middleware. It should return a paginated list of past distributions from `club_distribution_history` table, ordered by createdAt DESC. Add to admin routes.

---

## 💰 PART 5: Wallet & Transaction Completion (Process 4.0)

### ✅ 4.1 View Wallet Balances — DONE (via Dashboard) ✅
### ✅ 4.3 Request Withdrawal — DONE ✅

### ❌ 4.2 Fund Transfer (ID-to-ID)

```
Prompt 15:
```
> Write an Express.js route (POST /api/wallet/transfer) protected by auth middleware. Based on PRD §4 and DFT 4.2:
> 1. Accept `receiver_id` and `amount` from request body.
> 2. Validate receiver exists and is not the same as sender.
> 3. Inside a MySQL transaction with `SELECT...FOR UPDATE` row-level lock on BOTH sender and receiver wallet rows (prevent double-spending):
>    - Verify sender has sufficient `current_balance`.
>    - Debit sender's `current_balance` by amount.
>    - Credit receiver's `current_balance` by amount.
>    - Insert a record in `fund_transfers` table.
>    - Insert debit transaction for sender and credit transaction for receiver in `transactions` table.
>    - Log in `user_activity_logs` for both sender and receiver.
> 4. Return success with transfer details.
> Create `controllers/walletController.js` and `routes/walletRoutes.js`. Register in `server.js`.

---

### ❌ Get Wallet Balances (Dedicated)

```
Prompt 16:
```
> Write an Express.js route (GET /api/wallet) protected by auth middleware. It should return ALL 9 wallet fields + due_account for the authenticated user from the `wallets` table. Also include club eligibility/membership statuses from `club_memberships` table (show ALL clubs even if not eligible — "Universal Club Visibility" per PRD §4). Create in `controllers/walletController.js`.

---

## 📊 PART 6: Network / Generation Table (Not in any existing code)

```
Prompt 17:
```
> Write an Express.js route (GET /api/network?level=1) protected by auth middleware. Based on PRD §4 (No Tree View — Table format only):
> 1. Accept `level` query parameter (1 to 5, default 1).
> 2. For the logged-in user, fetch their downline at the specified generation level:
>    - Level 1: Users whose `sponsor_id` = logged-in user's ID.
>    - Level 2: Users whose `sponsor_id` is in Level 1 user IDs.
>    - Level 3: Users whose `sponsor_id` is in Level 2 user IDs... and so on up to Level 5.
> 3. For each downline user, return: id, phone, status, active package names, joined date.
> 4. Support pagination (page, limit query params).
> Create `controllers/networkController.js` and `routes/networkRoutes.js`. Register in `server.js`.

---

## 🛡️ PART 7: Admin Panel APIs (Process 5.0) — FULLY MISSING

### ❌ 5.1 User Audit Log

```
Prompt 18:
```
> Write an Express.js route (GET /api/admin/users/:id/audit) protected by auth + admin middleware. Based on PRD §5:
> Fetch the complete activity timeline for a specific user by querying:
> 1. `user_activity_logs` — login history, package purchases, club achievements, bans.
> 2. `transactions` — all financial transactions (generation bonuses, referrals, withdrawals, transfers).
> 3. `withdrawals` — withdrawal request history with statuses.
> Merge and sort all events by timestamp (DESC). Support pagination. Add to `controllers/adminController.js` and `routes/adminRoutes.js`.

---

### ❌ 5.2 User Management (View/Ban/Unban)

```
Prompt 19:
```
> Write the following Express.js admin routes protected by auth + admin middleware:
> 1. **GET /api/admin/users** — List all users with filters: ?status=active|inactive|banned, ?search=phone, pagination (?page, ?limit).
> 2. **GET /api/admin/users/:id** — Get single user profile + wallet details.
> 3. **PUT /api/admin/users/:id/ban** — Set user status to 'banned', log in audit.
> 4. **PUT /api/admin/users/:id/unban** — Set user status back to previous state (active/inactive), log in audit.
> Add all to `controllers/adminController.js` and `routes/adminRoutes.js`. Register in `server.js`.

---

### ❌ 5.3 Withdrawal Approval/Rejection

```
Prompt 20:
```
> Write Express.js admin routes for withdrawal management, protected by auth + admin middleware:
> 1. **GET /api/admin/withdrawals** — List all pending withdrawal requests with user details. Support filter ?status=pending|approved|rejected.
> 2. **PUT /api/admin/withdrawals/:id/approve** — Set withdrawal status to 'approved', set processed_at=NOW(), log in audit.
> 3. **PUT /api/admin/withdrawals/:id/reject** — Accept `admin_note` (rejection reason), set status='rejected', **refund the held amount back to user's current_balance** (important!), set processed_at=NOW(), insert refund transaction log, log in audit.
> All inside MySQL transactions. Add to `controllers/adminController.js` and `routes/adminRoutes.js`.

---

### ❌ 5.4 Manual Balance/Prize Adjustments

```
Prompt 21:
```
> Write an Express.js route (POST /api/admin/adjustments) protected by auth + admin middleware. Based on PRD §5:
> 1. Accept `user_id`, `wallet_field` (e.g., 'current_balance', 'reward_point', etc.), `amount`, and `description`.
> 2. Validate the wallet_field is one of the valid 9 wallet columns.
> 3. Inside a transaction:
>    - Update the specified wallet field for the target user.
>    - Log as transaction with `category='club_bonus'` or a new 'admin_adjustment' category, `type='credit'`.
>    - Log in `user_activity_logs` with action='ADMIN_ADJUSTMENT'.
> 4. Return success with updated balance.
> Add to admin routes.

---

### ❌ 5.5 Dealer Commission Config

```
Prompt 22:
```
> Write Express.js admin routes for dealer management:
> 1. **PUT /api/admin/dealers/:userId/config** — Accept `is_dealer` (boolean) and `commission_rate` (decimal). Update `users.is_dealer` and optionally store commission_rate. Log in audit.
> 2. **GET /api/admin/dealers** — List all users marked as dealers with their commission rates.
> Add to admin routes.

---

### ❌ 5.6 System Reports

```
Prompt 23:
```
> Write Express.js admin routes for system reporting (all protected by auth + admin):
> 1. **GET /api/admin/reports/sales** — Aggregate total package sales: SUM of all user_packages grouped by package type, with total revenue.
> 2. **GET /api/admin/reports/withdrawals** — Total withdrawals: SUM amount, SUM charge, SUM net_payable, grouped by status and method. Support date range filter.
> 3. **GET /api/admin/reports/clubs** — Club fund distribution history summary from `club_distribution_history`.
> 4. **GET /api/admin/reports/users** — Count of active, inactive, banned users. New registrations per day/week/month.
> 5. **GET /api/admin/reports/due-accounts** — List of all Gold Package users with their current due_account balances.
> Create `controllers/adminReportController.js`. Add all to `routes/adminRoutes.js`.

---

## ⏰ PART 8: Missing Cron Jobs (Process 6.0)

### ✅ 6.1 Gold Daily ROI — DONE ✅

### ❌ 6.2 Gold Due Account Updater

```
Prompt 24:
```
> Write a cron job in `jobs/goldDueAccount.job.js` that runs daily at 00:02 AM (Asia/Dhaka). Based on PRD §2C:
> 1. For each user with an active Gold Package: calculate (36% × 100,000) ÷ 365 = ~98.63 per day.
> 2. Add this daily_due amount to the buyer's `due_account` field in `wallets`.
> 3. Log each update as a transaction with `category='due_account_penalty'`, `type='debit'`.
> 4. Wrap all updates in a single MySQL transaction.
> Export `startGoldDueAccountJob()` and register in `server.js`.

---

### ❌ 6.3 Customer Package Expiry Check

```
Prompt 25:
```
> Write a cron job in `jobs/packageExpiry.job.js` that runs daily at midnight 00:00 AM (Asia/Dhaka). Based on PRD §2A:
> 1. Find all Customer Packages where `status='active'` AND `expires_at <= NOW()`.
> 2. Check if the user's `monthly_accumulated_pv >= 100` (reactivation threshold).
> 3. If PV < 100: Set `user_packages.status = 'expired'`, and set `users.status = 'inactive'` (but ONLY if they have no OTHER active packages — Package Independence rule from PRD §1).
> 4. If PV >= 100: Reset `monthly_accumulated_pv` to 0, extend `expires_at` by +30 days.
> 5. Log all changes in `user_activity_logs`.
> Export `startPackageExpiryJob()` and register in `server.js`.

---

### ❌ 6.4 Salary Club Auto-Promotion

```
Prompt 26:
```
> Write a cron job in `jobs/salaryClubPromotion.job.js` that runs daily at 00:05 AM (Asia/Dhaka). Based on PRD §3:
> 1. For each user, count their direct referrals (users where `sponsor_id = user.id`) who have an active Customer Package.
> 2. If count >= 15 AND the user is NOT already in the Salary Club (check `club_memberships` table), insert a new `club_memberships` record with `club_type='salary'`, `is_eligible=true`.
> 3. Log in `user_activity_logs` with action='CLUB_ACHIEVEMENT'.
> Export `startSalaryClubPromotionJob()` and register in `server.js`.

---

## 🛡️ PART 9: Missing Middlewares

### ✅ authMiddleware (authenticateUser) — DONE ✅
### ✅ roleMiddleware (authorizeAdmin) — DONE ✅

### ❌ Active Check Middleware

```
Prompt 27:
```
> Write an Express.js middleware `activeCheckMiddleware` in `middleware/activeCheck.js`. Based on PRD §2A Inactive Penalty:
> If the user's status is 'inactive', block them from earning any commission or making fund transfers. Return 403 with message "Your account is inactive. Purchase a package to activate."
> This should be applied to commission-related routes and fund transfer routes.

---

### ❌ Validation Middleware (Zod)

```
Prompt 28:
```
> Install Zod (`npm install zod`) and write a generic validation middleware `validate(schema)` in `middleware/validation.js`. Also create Zod schemas for all API inputs in a `validations/` folder:
> - `validations/auth.schema.js` — register (phone, password, sponsor_id), login (phone, password)
> - `validations/package.schema.js` — purchase (package_type)
> - `validations/wallet.schema.js` — transfer (receiver_id, amount)
> - `validations/withdrawal.schema.js` — request (amount, method, account_details)
> Apply the validation middleware to all existing routes.

---

### ❌ Rate Limit Middleware

```
Prompt 29:
```
> Install `express-rate-limit` (`npm install express-rate-limit`) and create `middleware/rateLimit.js`. Based on architecture.md §5:
> - Login: 5 attempts per minute per IP.
> - Fund Transfer: 10 per minute per user.
> - Withdrawal: 5 per hour per user.
> Export named rate limiters and apply to the respective routes.

---

### ❌ Global Error Handler Middleware

```
Prompt 30:
```
> Write a global error handling middleware in `middleware/errorHandler.js`. It should:
> 1. Catch all unhandled errors thrown in controllers/services.
> 2. Return consistent JSON: `{ success: false, message, errorCode, details }`.
> 3. Map common errors to proper HTTP status codes as defined in architecture.md §8.
> 4. In development mode, include the error stack trace.
> Register as the LAST middleware in `server.js` using `app.use(errorHandler)`.

---

## 🔐 PART 10: Auth Token Strategy Improvements

```
Prompt 31:
```
> Update the auth system based on architecture.md §5:
> 1. Implement **Refresh Token** strategy: Generate both a short-lived access token (15 min) and a long-lived refresh token (7 days).
> 2. Store JWT in **HttpOnly, Secure, SameSite=Strict cookies** instead of sending in response body (prevents XSS).
> 3. Create `POST /api/auth/refresh` endpoint to issue a new access token using the refresh token.
> 4. Create `POST /api/auth/logout` endpoint to clear JWT cookies.
> 5. Update `.env` with separate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
> Update `controllers/authController.js`, `middleware/auth.js`, and `routes/authRoutes.js`.

---

## 🏷️ PART 11: Club Membership APIs

```
Prompt 32:
```
> Write an Express.js route (GET /api/clubs) protected by auth middleware. Based on PRD §4 "Universal Club Visibility":
> 1. Return ALL 7 club types with the user's membership/eligibility status for each.
> 2. Even if the user is NOT eligible, show the club name with `is_eligible: false`.
> 3. For eligible clubs, show `joined_at` date.
> 4. Query `club_memberships` table for the logged-in user, then fill in the missing clubs as "not eligible".
> Create `controllers/clubController.js` and `routes/clubRoutes.js`. Register in `server.js`.

---

## 📋 EXECUTION ORDER (Recommended)

> [!IMPORTANT]
> নিচের ক্রম অনুসরণ করুন — কারণ পরের prompt-গুলো আগের prompt-এর output-এর উপর নির্ভরশীল।

| Step | Prompt # | বিষয় | নির্ভরতা |
|---|---|---|---|
| 1 | **Prompt 1-4** | Missing DB tables & schema fixes | None — এটা সবার আগে করতে হবে |
| 2 | **Prompt 30** | Global Error Handler middleware | None |
| 3 | **Prompt 27** | Active Check middleware | Auth middleware (done) |
| 4 | **Prompt 28** | Zod Validation middleware | None |
| 5 | **Prompt 29** | Rate Limit middleware | None |
| 6 | **Prompt 5** | Forgot Password route | None |
| 7 | **Prompt 8-9** | Commission Service (5% Gen + 2.5% Referral) | DB schema |
| 8 | **Prompt 7** | Package Purchase & Activation | Commission Service |
| 9 | **Prompt 10-11** | Gold Cancellation + View Packages | Package routes |
| 10 | **Prompt 15-16** | Fund Transfer + Wallet API | fund_transfers table |
| 11 | **Prompt 17** | Generation Network Table | None |
| 12 | **Prompt 24-26** | 3 Missing Cron Jobs | DB schema |
| 13 | **Prompt 12-14** | Club Distribution (Admin) | club tables |
| 14 | **Prompt 6, 18-23** | All Admin Panel APIs | All above |
| 15 | **Prompt 31** | Auth Token Strategy (Refresh/Cookie) | Auth routes |
| 16 | **Prompt 32** | Club Membership API | club_memberships table |

---

## 📁 Current vs Required File Structure

```diff
  mlm-backend/
  ├── config/
  │   └── db.js                          ✅ DONE
  ├── controllers/
  │   ├── authController.js              ✅ DONE
  │   ├── withdrawalController.js        ✅ DONE
  │   ├── dashboardController.js         ✅ DONE
+ │   ├── packageController.js           ❌ MISSING
+ │   ├── walletController.js            ❌ MISSING
+ │   ├── networkController.js           ❌ MISSING
+ │   ├── clubController.js              ❌ MISSING
+ │   ├── adminController.js             ❌ MISSING
+ │   ├── adminDistributionController.js ❌ MISSING
+ │   └── adminReportController.js       ❌ MISSING
  ├── middleware/
  │   └── auth.js                        ✅ DONE
+ │   ├── activeCheck.js                 ❌ MISSING
+ │   ├── validation.js                  ❌ MISSING
+ │   ├── rateLimit.js                   ❌ MISSING
+ │   └── errorHandler.js               ❌ MISSING
  ├── routes/
  │   ├── authRoutes.js                  ✅ DONE
  │   ├── withdrawalRoutes.js            ✅ DONE
  │   ├── dashboardRoutes.js             ✅ DONE
+ │   ├── packageRoutes.js               ❌ MISSING
+ │   ├── walletRoutes.js                ❌ MISSING
+ │   ├── networkRoutes.js               ❌ MISSING
+ │   ├── clubRoutes.js                  ❌ MISSING
+ │   └── adminRoutes.js                 ❌ MISSING
+ ├── services/
+ │   └── commissionService.js           ❌ MISSING
+ ├── validations/
+ │   ├── auth.schema.js                 ❌ MISSING
+ │   ├── package.schema.js              ❌ MISSING
+ │   ├── wallet.schema.js               ❌ MISSING
+ │   └── withdrawal.schema.js           ❌ MISSING
  ├── jobs/
  │   └── goldDailyROI.job.js            ✅ DONE
+ │   ├── goldDueAccount.job.js          ❌ MISSING
+ │   ├── packageExpiry.job.js           ❌ MISSING
+ │   └── salaryClubPromotion.job.js     ❌ MISSING
  ├── prisma/
  │   └── schema.prisma                  ⚠️ PARTIAL (missing 3 tables + fields)
  ├── server.js                          ⚠️ PARTIAL (only 3 routes registered)
  ├── .env                               ⚠️ PARTIAL (missing many config vars)
  └── package.json                       ⚠️ PARTIAL (missing zod, express-rate-limit)
```
