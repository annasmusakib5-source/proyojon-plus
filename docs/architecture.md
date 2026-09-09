# Architecture Design: Proyojon Plus

## 1. Overview
The "Proyojon Plus" platform is designed using a **Layered Monolith Architecture**. This ensures a clean separation of concerns, easier maintenance, and the ability to strictly control complex MLM financial logic in a single unified backend before sending it to the database.

- **Project Type**: Multi-Level Marketing (MLM) E-commerce & Investment Platform
- **Business Model**: Unilevel Generation Plan (Table View) with Multi-Package & Club Systems
- **Platform**: Web-based (User Dashboard + Admin Control Panel)

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14+ (App Router) | SSR/CSR, User Dashboard & Admin Panel |
| CSS Framework | TailwindCSS | Responsive, utility-first styling |
| State Management | Zustand | Lightweight global state (Wallets, User session) |
| Backend API | Express.js (Node.js) | RESTful API, business logic, routing |
| ORM / Query | Prisma | Type-safe MySQL queries, migrations, schema management |
| Database | MySQL 8+ | Relational DB with ACID compliance |
| Auth | JWT + bcrypt | Token-based auth with hashed passwords |
| Validation | Zod | Input validation on both frontend & backend |
| Task Scheduler | node-cron | Daily automated background jobs |
| HTTP Client | Axios | Frontend-to-Backend API calls |
| Env Config | dotenv | Environment variable management |

---

## 3. System Architecture: Layered Monolith Flow

The backend application follows a strict 4-tier layered approach. **No layer may skip a tier** — Controllers cannot call Repositories directly; they must always go through Services.

### A. Presentation Layer (Routes, Middlewares & Controllers)

**Routes** — Defines all RESTful API endpoints grouped by domain:
- `/api/auth/*` — Registration, Login, Forgot Password
- `/api/packages/*` — Purchase, Activate, Cancel packages
- `/api/wallet/*` — View balances, Fund transfer
- `/api/withdrawals/*` — Request, Status check
- `/api/network/*` — View Generation Table (Level 1–5)
- `/api/clubs/*` — Club membership status, eligibility
- `/api/admin/users/*` — User CRUD, ban, password reset
- `/api/admin/distribution/*` — Trigger 100 PV distribution
- `/api/admin/withdrawals/*` — Approve/Reject withdrawals
- `/api/admin/reports/*` — Sales, withdrawal, club fund reports
- `/api/admin/adjustments/*` — Manual balance/prize awards
- `/api/admin/dealers/*` — Dealer commission config

**Middlewares:**
- `authMiddleware` — Validates JWT from HttpOnly cookies. Rejects unauthenticated requests.
- `roleMiddleware(role)` — Restricts routes to specific roles ('user' or 'admin').
- `activeCheckMiddleware` — Blocks commission-related actions if the user's Customer Package is inactive (PRD: Inactive Penalty rule).
- `validationMiddleware(schema)` — Uses Zod schemas to validate request body/params/query.
- `rateLimitMiddleware` — Rate-limits sensitive endpoints (login, fund transfer, withdrawal).
- `errorMiddleware` — Global error handler; catches all thrown errors and returns consistent JSON error responses.

**Controllers** — Thin layer that:
1. Extracts validated data from `req`.
2. Calls the appropriate Service method.
3. Returns standardized JSON: `{ success: boolean, data: any, message: string }`.

---

### B. Core Business Logic Layer (Services)

Each service encapsulates a specific domain of PRD logic. Services are **stateless** and independent of HTTP context.

| Service | Responsibility | PRD Reference |
|---------|---------------|---------------|
| **AuthService** | Phone+Password registration with sponsor_id validation. JWT generation (access + refresh tokens). Admin manual password reset. | PRD §1: Registration, Password Recovery |
| **PackageService** | Purchases Customer (1000 PV), Shareholder (5000 SP), Gold (5000 GP) packages. Ensures multi-package independence — one package expiring does NOT affect others. Handles account activation via PV accumulation. | PRD §1: Account Activation, Multi-Package, Package Independence. PRD §2: All 3 packages |
| **CommissionService** | **5% Generation Bonus**: On any package sale, traverses 5 sponsor levels upward, credits 1% per level exclusively to each upline's **Hajj Club** (NOT Current Balance). **Shareholder Referral**: Instant 2.5% of SP to referrer's Current Balance. Skips inactive uplines. | PRD §2A: 5% Rule, Crucial Logic. PRD §2B: Referral Commission |
| **GoldROIService** | **Gold Referral Drip-feed**: Calculates 1.8% of GP, divides by 365, credits daily portion to referrer's Current Balance. Stops immediately on package cancellation. **Due Account**: Calculates 36% of 100,000 GP (= 36,000) ÷ 365, adds daily to buyer's Due Account. On cancellation, buyer must pay accumulated Due to Admin. | PRD §2C: Referral Commission, Cancellation & Due Account Logic |
| **ClubDistributionService** | Admin-triggered 100 PV global distribution. Splits funds: 20% Daily Club, 10% Shareholder Club (only Shareholder buyers), 10% Hajj Club, 7% Reward Point, 5% Monthly Prize Point, 5% Hajj Lottery Club, 3% Salary Club. Divides each club's portion equally among eligible members. | PRD §3: The 100 PV Global Distribution |
| **SalaryClubService** | Monitors each user's direct referral count of Customer Package holders. When count reaches 15, automatically promotes user to Salary Club member. | PRD §3: Salary Club Achievement |
| **WalletService** | Reads wallet balances (all 7 clubs + current balance + total income + due account). ID-to-ID fund transfers with row-level locking. | PRD §4: Visible Wallets, Fund Transfer |
| **WithdrawalService** | Creates withdrawal requests (Bank/bKash/Nagad/Rocket). Applies flat 5% charge. Calculates net_amount. | PRD §4: Withdrawal System |
| **NetworkService** | Fetches user's generation network (Level 1 to Level 5) as a paginated table (NOT tree view). Uses recursive sponsor_id lookups. | PRD §4: No Tree View |
| **AdminService** | Individual user audit logs (login, purchases, transfers, withdrawals, club achievements). User management (view/reset password, lock/ban). Manual balance/prize adjustments. Macro reports (Overall Sales, Total Withdrawals, Club Fund History, Active vs Inactive users, Due Account logs). | PRD §5: All Admin Controls |
| **DealerCommissionService** | Configurable 5% commission for Dealers on physical product sales. Admin sets dealer status and commission rate. | PRD §5: Dealer Commission |

---

### C. Background Jobs (Node-Cron Layer)

All cron jobs run as part of the Express.js process. Each job is wrapped in a database transaction.

| Job Name | Schedule | Logic | PRD Reference |
|----------|----------|-------|---------------|
| **Gold Daily ROI** | Every day at 00:01 AM | For each active Gold Package: (1.8% × GP amount) ÷ 365 → credit to referrer's Current Balance. | PRD §2C: Drip-feed |
| **Gold Due Account Updater** | Every day at 00:02 AM | For each active Gold Package buyer: (36% × 100,000) ÷ 365 → add to buyer's Due Account. | PRD §2C: Cancellation & Due Account |
| **Customer Package Expiry** | Every day at 00:00 AM (midnight) | Check all Customer Packages. If 30 days passed AND accumulated monthly PV < 100, mark package as Inactive. Block all generation/referral income. | PRD §2A: Validity, Reactivation Rule, Inactive Penalty |
| **Salary Club Auto-Promotion** | Every day at 00:05 AM | Count each user's direct referrals with active Customer Packages. If count ≥ 15 and user is not already in Salary Club, auto-promote. | PRD §3: Salary Club Achievement |

---

### D. Data Access Layer & Database (MySQL)

**Repositories** — Each service has a corresponding repository file. Repositories:
- Execute raw SQL or Prisma queries.
- Never contain business logic.
- Always accept and propagate transaction objects for atomicity.

**Transaction Strategy:**
- All financial operations (fund transfers, commission distributions, withdrawals) are wrapped in `BEGIN → COMMIT / ROLLBACK`.
- `SELECT ... FOR UPDATE` (row-level locking) used on wallet rows during fund transfers to prevent double-spending.

---

## 4. High-Level Database Schema Design

### 4.1 Users Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT (PK, AUTO_INCREMENT) | Unique User ID |
| `phone` | VARCHAR(15) UNIQUE | Login credential (no email) |
| `password_hash` | VARCHAR(255) | bcrypt hashed |
| `sponsor_id` | INT (FK → Users.id) NULLABLE | Self-referencing for MLM tree |
| `role` | ENUM('user', 'admin') | Default: 'user' |
| `is_dealer` | BOOLEAN | Default: false |
| `status` | ENUM('active', 'inactive', 'banned') | Default: 'inactive' (activated on first package) |
| `created_at` | DATETIME | Registration timestamp |
| `updated_at` | DATETIME | Last profile update |

### 4.2 Wallets Table (1-to-1 with Users)
| Column | Type | Notes |
|--------|------|-------|
| `user_id` | INT (PK, FK → Users.id) | |
| `current_balance` | DECIMAL(15,2) | Withdrawable balance |
| `total_income` | DECIMAL(15,2) | Lifetime earnings (read-only accumulator) |
| `daily_club` | DECIMAL(15,2) | Daily Club fund |
| `salary_club` | DECIMAL(15,2) | Salary Club fund |
| `hajj_club` | DECIMAL(15,2) | Hajj Club / Hajj Fund |
| `shareholder_club` | DECIMAL(15,2) | Shareholder Club fund |
| `hajj_lottery_club` | DECIMAL(15,2) | Hajj Lottery Club fund |
| `reward_point` | DECIMAL(15,2) | Reward Point balance |
| `monthly_prize_point` | DECIMAL(15,2) | Monthly Prize Point balance |
| `due_account` | DECIMAL(15,2) | Gold Package cancellation penalty accumulator |

### 4.3 User_Packages Table (1-to-Many with Users)
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT (PK) | |
| `user_id` | INT (FK → Users.id) | |
| `package_type` | ENUM('customer', 'shareholder', 'gold') | |
| `point_amount` | INT | 1000 PV / 5000 SP / 5000 GP |
| `status` | ENUM('active', 'expired', 'canceled') | |
| `activation_date` | DATETIME | |
| `expiry_date` | DATETIME | Customer: activation + 30 days |
| `monthly_accumulated_pv` | INT DEFAULT 0 | For Customer reactivation tracking (100 PV rule) |
| `countdown_end_date` | DATETIME NULLABLE | Gold Package: activation + 365 days |

### 4.4 Transactions Table (Financial Ledger)
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT (PK) | |
| `user_id` | INT (FK → Users.id) | |
| `type` | ENUM('credit', 'debit') | |
| `amount` | DECIMAL(15,2) | |
| `wallet_field` | VARCHAR(50) | Which wallet was affected (e.g., 'hajj_club', 'current_balance') |
| `purpose` | ENUM('generation_bonus', 'shareholder_referral', 'gold_roi', 'fund_transfer', 'withdrawal', 'club_distribution', 'admin_adjustment', 'dealer_commission', 'package_purchase') | |
| `reference_id` | INT NULLABLE | Links to related package/withdrawal/transfer |
| `description` | VARCHAR(255) | Human-readable note |
| `created_at` | DATETIME | |

### 4.5 Withdrawals Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT (PK) | |
| `user_id` | INT (FK → Users.id) | |
| `amount` | DECIMAL(15,2) | Requested amount |
| `charge` | DECIMAL(15,2) | 5% flat fee |
| `net_amount` | DECIMAL(15,2) | amount - charge |
| `method` | ENUM('bank', 'bkash', 'nagad', 'rocket') | |
| `account_number` | VARCHAR(50) | Target account |
| `account_holder_name` | VARCHAR(100) | |
| `status` | ENUM('pending', 'approved', 'rejected') | |
| `admin_note` | TEXT NULLABLE | Reason for rejection if any |
| `created_at` | DATETIME | |
| `processed_at` | DATETIME NULLABLE | When admin approved/rejected |

### 4.6 Fund_Transfers Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT (PK) | |
| `sender_id` | INT (FK → Users.id) | |
| `receiver_id` | INT (FK → Users.id) | |
| `amount` | DECIMAL(15,2) | |
| `created_at` | DATETIME | |

### 4.7 Club_Memberships Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT (PK) | |
| `user_id` | INT (FK → Users.id) | |
| `club_type` | ENUM('daily', 'shareholder', 'hajj', 'hajj_lottery', 'salary', 'reward', 'monthly_prize') | |
| `is_eligible` | BOOLEAN | Whether the user currently qualifies |
| `joined_at` | DATETIME | When eligibility was first achieved |

### 4.8 Club_Distribution_History Table
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT (PK) | |
| `triggered_by` | INT (FK → Users.id) | Admin who triggered |
| `total_pv_distributed` | DECIMAL(15,2) | Base PV (100) |
| `daily_club_amount` | DECIMAL(15,2) | 20% |
| `shareholder_club_amount` | DECIMAL(15,2) | 10% |
| `hajj_club_amount` | DECIMAL(15,2) | 10% |
| `reward_point_amount` | DECIMAL(15,2) | 7% |
| `monthly_prize_amount` | DECIMAL(15,2) | 5% |
| `hajj_lottery_amount` | DECIMAL(15,2) | 5% |
| `salary_club_amount` | DECIMAL(15,2) | 3% |
| `eligible_member_counts` | JSON | `{ daily: N, shareholder: N, ... }` |
| `created_at` | DATETIME | |

### 4.9 Audit_Logs Table (Admin Audit)
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT (PK) | |
| `user_id` | INT (FK → Users.id) | User whose activity is logged |
| `action` | VARCHAR(100) | e.g., 'login', 'package_purchase', 'fund_transfer', 'withdrawal_request', 'club_achievement', 'password_reset', 'account_banned' |
| `details` | JSON | Additional context `{ package_type: 'gold', amount: 5000 }` |
| `ip_address` | VARCHAR(45) | |
| `created_at` | DATETIME | |

### 4.10 Dealer_Products Table (Physical Products)
| Column | Type | Notes |
|--------|------|-------|
| `id` | INT (PK) | |
| `name` | VARCHAR(255) | Product name |
| `price` | DECIMAL(15,2) | |
| `pv_value` | INT | PV equivalent of this product |
| `dealer_commission_rate` | DECIMAL(5,2) | Default 5%, Admin configurable |
| `status` | ENUM('active', 'inactive') | |

---

## 5. Security & Authentication Strategy

| Concern | Approach |
|---------|----------|
| Registration | Phone Number + Sponsor ID only (NO email/Gmail). PRD §1 |
| Login | Phone + Password → bcrypt compare → JWT issued |
| Token Storage | JWT in **HttpOnly, Secure, SameSite=Strict** cookies (prevents XSS & CSRF) |
| Token Refresh | Short-lived access token (15 min) + long-lived refresh token (7 days) |
| Password Hashing | bcrypt with salt rounds = 12 |
| Password Recovery | NO automated OTP/email. "Forgot Password" → redirects to "Contact Admin" page showing Admin's phone number. Admin manually resets via Admin Panel. PRD §1 |
| Admin Viewing Passwords | Admin can view user credentials (PRD §5) — stored hash can be bypassed by Admin reset only |
| Rate Limiting | Login: 5 attempts/min. Fund Transfer: 10/min. Withdrawal: 5/hour |
| Input Validation | Zod schemas on every API endpoint |
| SQL Injection | Prevented by Prisma's parameterized queries |
| CORS | Whitelist only the Next.js frontend domain |

---

## 6. Frontend Architecture (Next.js)

### 6.1 Page Structure
```
/                          → Landing / Marketing page
/login                     → Phone + Password login
/register                  → Phone + Sponsor ID + Password
/forgot-password           → Static "Contact Admin" page with Admin phone number
/dashboard                 → User Dashboard (protected)
/dashboard/network         → Generation Table (Level 1–5, NO tree view)
/dashboard/packages        → View & Purchase packages
/dashboard/wallet          → All wallet balances + Fund transfer form
/dashboard/withdrawals     → Request withdrawal + History
/dashboard/clubs           → All club statuses (visible even if not eligible)
/admin                     → Admin Dashboard (protected, role=admin)
/admin/users               → User list + search + view/edit/ban
/admin/users/[id]          → Individual user audit log & activity timeline
/admin/distribution        → 100 PV distribution trigger (shows eligible counts)
/admin/withdrawals         → Approve/Reject queue
/admin/reports             → Sales, Withdrawals, Club Funds, Active/Inactive, Due Accounts
/admin/dealers             → Dealer management & commission config
/admin/adjustments         → Manual prize/balance awards
```

### 6.2 Dashboard UI Requirements (PRD §4)
- **No Tree View** — Generation network displayed as a **paginated Data Table** only.
- **Wallet Grid** — All 9 wallet blocks visible at all times:
  - Current Balance, Total Income, Daily Club Bonus, Salary Club, Hajj Club/Fund, Shareholder Club, Hajj Lottery Club, Reward Point, Monthly Prize Point.
- **Universal Club Visibility** — Even ineligible users see all club names with "Not Eligible" status to encourage upgrades.
- **Gold Package Countdown Timer** — Live timer (Days, Hours, Minutes, Seconds) in the dashboard header for Gold Package buyers.
- **Due Account Display** — Gold Package buyers see their accumulated due amount prominently.

---

## 7. API Endpoint Reference

### Auth APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with phone, password, sponsor_id |
| POST | `/api/auth/login` | Login with phone + password, returns JWT cookie |
| POST | `/api/auth/logout` | Clears JWT cookie |
| POST | `/api/auth/refresh` | Refresh access token |

### Package APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packages` | List user's active packages |
| POST | `/api/packages/purchase` | Buy a package (customer/shareholder/gold) |
| POST | `/api/packages/:id/cancel` | Cancel Gold Package (triggers Due Account payment) |

### Wallet APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wallet` | Get all wallet balances |
| POST | `/api/wallet/transfer` | ID-to-ID fund transfer |

### Withdrawal APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/withdrawals` | Create withdrawal request |
| GET | `/api/withdrawals` | List user's withdrawal history |

### Network APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/network?level=1` | Get generation table for a specific level (1–5) |

### Club APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clubs` | Get user's club memberships & eligibility statuses |

### Admin APIs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users with filters (active/inactive/banned) |
| GET | `/api/admin/users/:id` | Get single user profile + wallet |
| GET | `/api/admin/users/:id/audit` | Get user's full activity audit log |
| PUT | `/api/admin/users/:id/reset-password` | Manually reset a user's password |
| PUT | `/api/admin/users/:id/ban` | Lock/Ban a user ID |
| PUT | `/api/admin/users/:id/unban` | Unlock a user ID |
| POST | `/api/admin/distribution/trigger` | Execute 100 PV global distribution |
| GET | `/api/admin/distribution/preview` | Preview eligible member counts per club before trigger |
| GET | `/api/admin/distribution/history` | View past distribution logs |
| GET | `/api/admin/withdrawals` | List all pending withdrawal requests |
| PUT | `/api/admin/withdrawals/:id/approve` | Approve a withdrawal |
| PUT | `/api/admin/withdrawals/:id/reject` | Reject a withdrawal with reason |
| POST | `/api/admin/adjustments` | Manually add balance/prize to a user |
| GET | `/api/admin/reports/sales` | Overall sales report |
| GET | `/api/admin/reports/withdrawals` | Total withdrawal report |
| GET | `/api/admin/reports/clubs` | Club fund history |
| GET | `/api/admin/reports/users` | Active vs Inactive user stats |
| GET | `/api/admin/reports/due-accounts` | Due Account logs for Gold Package users |
| PUT | `/api/admin/dealers/:userId/config` | Set dealer status & commission rate |

---

## 8. Error Handling Strategy

All errors follow a consistent JSON response format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errorCode": "INSUFFICIENT_BALANCE",
  "details": {}
}
```

| Error Code | HTTP Status | Scenario |
|------------|-------------|----------|
| `INVALID_CREDENTIALS` | 401 | Wrong phone/password |
| `UNAUTHORIZED` | 401 | Missing or expired JWT |
| `FORBIDDEN` | 403 | Non-admin accessing admin route |
| `ACCOUNT_INACTIVE` | 403 | Inactive user trying to earn commission |
| `ACCOUNT_BANNED` | 403 | Banned user trying to log in |
| `INSUFFICIENT_BALANCE` | 400 | Fund transfer/withdrawal exceeds balance |
| `PACKAGE_ALREADY_ACTIVE` | 400 | Trying to buy same package type that's already active |
| `INVALID_SPONSOR` | 400 | Sponsor ID doesn't exist |
| `DUE_ACCOUNT_UNPAID` | 400 | Gold cancellation attempted without clearing due |
| `VALIDATION_ERROR` | 422 | Zod validation failure |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 9. Backend Folder Structure

```
server/
├── src/
│   ├── config/
│   │   ├── database.js          # MySQL/Prisma connection
│   │   ├── env.js               # Environment variable loader
│   │   └── cors.js              # CORS configuration
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── package.routes.js
│   │   ├── wallet.routes.js
│   │   ├── withdrawal.routes.js
│   │   ├── network.routes.js
│   │   ├── club.routes.js
│   │   └── admin.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── package.controller.js
│   │   ├── wallet.controller.js
│   │   ├── withdrawal.controller.js
│   │   ├── network.controller.js
│   │   ├── club.controller.js
│   │   └── admin.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── package.service.js
│   │   ├── commission.service.js
│   │   ├── goldROI.service.js
│   │   ├── clubDistribution.service.js
│   │   ├── salaryClub.service.js
│   │   ├── wallet.service.js
│   │   ├── withdrawal.service.js
│   │   ├── network.service.js
│   │   ├── admin.service.js
│   │   └── dealerCommission.service.js
│   ├── repositories/
│   │   ├── user.repository.js
│   │   ├── wallet.repository.js
│   │   ├── package.repository.js
│   │   ├── transaction.repository.js
│   │   ├── withdrawal.repository.js
│   │   ├── club.repository.js
│   │   └── auditLog.repository.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── activeCheck.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── error.middleware.js
│   ├── jobs/
│   │   ├── goldDailyROI.job.js
│   │   ├── goldDueAccount.job.js
│   │   ├── packageExpiry.job.js
│   │   └── salaryClubPromotion.job.js
│   ├── validations/
│   │   ├── auth.schema.js
│   │   ├── package.schema.js
│   │   ├── wallet.schema.js
│   │   └── withdrawal.schema.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── bcrypt.js
│   │   ├── response.js           # Standardized response helper
│   │   └── constants.js          # Package amounts, commission rates, etc.
│   └── app.js                    # Express app setup
├── prisma/
│   └── schema.prisma             # Database schema
├── .env
├── package.json
└── server.js                     # Entry point
```

---

## 10. Frontend Folder Structure (Next.js App Router)

```
client/
├── src/
│   ├── app/
│   │   ├── layout.js
│   │   ├── page.js                     # Landing page
│   │   ├── login/page.js
│   │   ├── register/page.js
│   │   ├── forgot-password/page.js     # Static "Contact Admin" page
│   │   ├── dashboard/
│   │   │   ├── layout.js              # Protected layout with sidebar
│   │   │   ├── page.js               # Main dashboard (wallets grid)
│   │   │   ├── network/page.js       # Generation Table (Levels 1–5)
│   │   │   ├── packages/page.js      # View & Buy packages
│   │   │   ├── wallet/page.js        # Balances + Fund transfer
│   │   │   ├── withdrawals/page.js   # Request + History
│   │   │   └── clubs/page.js         # All club statuses
│   │   └── admin/
│   │       ├── layout.js             # Admin protected layout
│   │       ├── page.js               # Admin dashboard overview
│   │       ├── users/page.js         # User list
│   │       ├── users/[id]/page.js    # User detail + audit log
│   │       ├── distribution/page.js  # 100 PV trigger
│   │       ├── withdrawals/page.js   # Approve/Reject queue
│   │       ├── reports/page.js       # Macro reports
│   │       ├── dealers/page.js       # Dealer management
│   │       └── adjustments/page.js   # Manual awards
│   ├── components/
│   │   ├── ui/                        # Reusable UI components
│   │   ├── dashboard/                 # Dashboard-specific components
│   │   │   ├── WalletGrid.js
│   │   │   ├── CountdownTimer.js      # Gold Package 365-day timer
│   │   │   ├── GenerationTable.js
│   │   │   └── ClubStatusCard.js
│   │   └── admin/                     # Admin-specific components
│   ├── lib/
│   │   ├── api.js                     # Axios instance with cookie auth
│   │   └── utils.js
│   ├── store/
│   │   ├── useAuthStore.js            # Zustand auth store
│   │   └── useWalletStore.js          # Zustand wallet store
│   └── styles/
│       └── globals.css
├── public/
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 11. Environment Configuration

```env
# Backend (.env)
PORT=5000
NODE_ENV=development
DATABASE_URL=mysql://user:password@localhost:3306/proyojon_plus
JWT_ACCESS_SECRET=<random-secret>
JWT_REFRESH_SECRET=<random-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
BCRYPT_SALT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000
ADMIN_CONTACT_PHONE=01XXXXXXXXX

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 12. Request Data Flow

```
1. Client (Next.js) → HTTP Request (with JWT cookie)
2. Express Router → Middleware Chain (Auth → Role → ActiveCheck → Validation)
3. Controller → Extracts validated data
4. Service → Applies business rules (commission math, club logic)
5. Repository → Executes DB query within transaction
6. MySQL → Returns result
7. Response travels back up → Controller sends JSON to Client
```
