# 🚀 AtomQuest 1.0
**Next-Generation Performance Management & Goal Tracking Platform**

AtomQuest is a high-performance, enterprise-grade Goal Setting and Tracking Portal built for the modern workforce. Designed with mathematical rigor, seamless role-based workflows, and a stunning UI, it replaces archaic performance reviews with real-time, automated, and shared quarterly check-ins.

![AtomQuest Cover Image](https://via.placeholder.com/1200x600/09090b/ffffff?text=AtomQuest+Performance+Management+Platform)

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Users ["User Personas (Role-Based Access)"]
        E[Employee]
        M[Manager]
        A[Admin / HR]
    end

    E -->|Submit Goals & Check-ins| F1
    M -->|Approve/Reject & Push KPIs| F1
    A -->|View Analytics & Audit Logs| F1

    subgraph Frontend ["Frontend (Vercel Edge)"]
        F1[Next.js 15 App Router]
        F1 --> F2[Zustand & TanStack Query]
        F1 --> F3[Shadcn UI + Tailwind CSS]
    end

    F2 <-->|JSON Payloads| B1

    subgraph Backend ["Backend API (Vercel Serverless)"]
        B1[Next.js API Routes]
        B1 --> B2[NextAuth.js SSO]
        B1 --> B3[Zod Schema Validation]
        B3 --> B4[Prisma ORM]
    end

    subgraph Cloud ["Cloud Infrastructure"]
        C1[Vercel Cron Jobs] -->|Daily Trigger| B1
        B4 <--> C2[(Supabase PostgreSQL)]
    end
```

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
- **SLA Escalation Engine:** A Vercel Cron Job sweeps the PostgreSQL database daily. Goals that miss deadlines or check-ins are automatically flagged, generating an Escalation Ticket visible in a dedicated Admin Dashboard for HR resolution.

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
