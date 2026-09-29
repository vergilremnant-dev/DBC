# DBC Abhista — Digital Building & Construction Marketplace

DBC Abhista is an end-to-end professional marketplace and project coordination platform connecting property owners with certified construction contractors, architects, civil engineers, structural consultants, and trade specialists.

---

## 🏗️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Redux Toolkit, React Router v7
- **Backend / APIs**: Node.js & TypeScript Serverless API Gateway (`api/`), Prisma ORM (`@prisma/client`)
- **Database**: PostgreSQL (Supabase with connection pooling & transaction modes)
- **Payment Gateway**: Razorpay (Server-side HMAC-SHA256 signature verification)
- **Testing & Quality**: Vitest, ESLint, TypeScript Strict Compiler (`tsc`)

---

## 📁 Repository Structure

```
.
├── api/                     # Backend Serverless REST Endpoints
│   ├── admin/               # Admin analytics, reviews, users, verification
│   ├── auth/                # Authentication (JWT, refresh, sessions)
│   ├── bookings/            # Booking management & scheduling
│   ├── search/              # Professional & service discovery engine
│   ├── services/            # Business logic, pricing engine & DB transactions
│   ├── subscriptions/       # Razorpay order generation & payment verification
│   └── utils/               # Prisma DB instance, env validator, rate limiter, cache
├── prisma/                  # Prisma Database Schema & Seed scripts
│   ├── schema.prisma        # Complete database schema
│   └── seed.js              # Initial database seed script
├── public/                  # Public assets, brand icons, manifest, favicon
├── src/                     # React Frontend Application
│   ├── assets/              # Branding SVG logos & illustrations
│   ├── components/          # Reusable UI components & layouts
│   ├── config/              # Application branding & system metadata
│   ├── context/             # Global UI contexts (Navigation, City filters)
│   ├── hooks/               # Custom hooks (useAuth, usePermission, Redux)
│   ├── layouts/             # PublicLayout and WorkspaceLayout shells
│   ├── pages/               # Marketplace, Workspace, Auth, Admin & Shared pages
│   ├── routes/              # ProtectedRoute role-based access controller
│   ├── services/            # Axios API service clients
│   ├── store/               # Redux Toolkit state store & auth slice
│   ├── types/               # TypeScript domain interfaces & DTOs
│   └── utils/               # Formatting, cookies, and date helpers
├── tests/                   # Vitest Automated Test Suite
│   ├── backend/             # Auth, Search, Bookings, Subscriptions, Chat tests
│   └── frontend/            # RBAC and client permission tests
├── .env.example             # Environment variables template
├── api-dev-server.js        # Local Express development proxy for serverless functions
└── package.json             # Project dependencies and lifecycle scripts
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- PostgreSQL / Supabase Database instance

### 2. Installation
```bash
# Clone repository
git clone https://github.com/Sanjaychagantipati/Abhista.git
cd Abhista

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and fill in your configuration:
```bash
cp .env.example .env
```

Required environment variables:
```bash
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
JWT_SECRET="your-strong-random-jwt-secret-min-32-chars"
NODE_ENV="development"
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Seed sample data
npm run seed
```

### 5. Running the Application
```bash
# Start Vite frontend and API dev server concurrently
npm run dev
```

---

## 🧪 Testing & Verification

```bash
# Run unit & integration test suites
npm run test

# Typecheck and production bundle build
npm run build

# Run linter
npm run lint
```

---

## 🔒 Security & RBAC

- **Authentication**: Stateless JWT access tokens with secure HTTP-only refresh tokens.
- **RBAC**: Enforced role-based access control across `ROLE_CUSTOMER`, `ROLE_PROVIDER`, and `ROLE_ADMIN`.
- **Payment Integrity**: Razorpay secret is strictly server-side only with timing-safe HMAC-SHA256 signature verification.
- **Environment Isolation**: Sensitive credentials are never committed or exposed to the client bundle.

---

## 🚀 Deployment & Version Control

- **Primary Deployment Target**: Vercel Serverless Gateway
- **GitHub Organization / Repository**: `vergilremnant-dev/DBC`

