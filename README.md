# 🚀 AtomQuest 1.0
**Next-Generation Performance Management & Goal Tracking Platform**

AtomQuest is a high-performance, enterprise-grade Goal Setting and Tracking Portal built for the modern workforce. Designed with mathematical rigor, seamless role-based workflows, and a stunning UI, it replaces archaic performance reviews with real-time, automated, and shared quarterly check-ins.

![AtomQuest Cover Image](https://via.placeholder.com/1200x600/09090b/ffffff?text=AtomQuest+Performance+Management+Platform)

---

## 🌟 Key Features

### 🔐 1. Role-Based Access Control (RBAC)
Strict, middleware-protected workflows tailored to three core personas:
- **Employees:** Create goals, log quarterly check-ins, and track personal achievement.
- **Managers:** Approve/Reject goals, request rework, push shared department KPIs, and provide feedback.
- **Admins:** Oversee organization analytics, monitor escalations, and unlock frozen goals.

### 🎯 2. Intelligent Progress Engine
A sophisticated goal-tracking engine with multiple Units of Measurement (UoM):
- **Numeric & Percentage:** Standard fractional achievement tracking.
- **Timeline:** Date-driven goal progression.
- **Zero-Based:** Binary edge-case handling (e.g., Target=0, dividing-by-zero protection).

### 🤝 3. Cascading Shared KPIs
Managers can push Master Department KPIs down to their team. Employees inherit these shared goals and can only modify their personal weightage, ensuring total organizational alignment while preserving data consistency across the database.

### ⏳ 4. Automated Workflows & Escalation
- **Strict Validation:** Real-time checking to ensure goal weightages exactly equal 100% and maximum limits are enforced.
- **Goal Locking:** Approved goals are mathematically frozen to preserve audit integrity.
- **Cron Engine:** An automated nightly escalation engine queries the Prisma database for missed deadlines and dispatches notifications.

### 📊 5. Real-Time Analytics & Exports
- **Live CSV Export:** Download entire department performance reports in one click.
- **Recharts Integration:** Gorgeous, glassmorphic data visualization for QoQ trends, goal distribution, and achievement matrixes.

---

## 💻 Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** PostgreSQL via Prisma ORM
- **Authentication:** NextAuth.js (Entra ID Mocking)
- **Styling:** Tailwind CSS, Framer Motion
- **UI Components:** Shadcn UI, Base UI, Lucide Icons
- **Validation:** Zod

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/atomquest.git
cd atomquest
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/atomquest"
NEXTAUTH_SECRET="your-super-secret-string-for-jwt"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Push Database Schema
```bash
npx prisma db push
```

### 5. Start the Application
```bash
npm run dev
```

---

## 🔑 Demo Credentials

AtomQuest features an auto-provisioning mock authentication system for easy hackathon judging. Simply use the following emails (any password works) to instantly switch between roles:

- **Admin Access:** `admin@demo.com`
- **Manager Access:** `manager@demo.com`
- **Employee Access:** `employee@demo.com`

---

## 🛡️ Security & Integrity

AtomQuest was engineered with enterprise-level constraints:
- **Zod Schema Validation:** Every API route strictly validates incoming payloads. Negative numeric values, missing fields, or weightage overflows are instantly rejected.
- **Prisma Transactions:** Complex operations (like syncing shared KPIs) utilize database-level transaction guarantees.
- **Zero-Trust UI:** Forms remount dynamically to prevent React state caching, and the UI never trusts client-side state without backend verification.

---

*Built for the Future of Work.*
