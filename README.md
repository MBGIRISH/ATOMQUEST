<div align="center">

<img src="./public/atomquest-banner.jpg" alt="AtomQuest Hackathon 1.0 Banner" width="800" style="border-radius: 12px; margin-bottom: 20px;" />

# 🚀 AtomQuest 1.0

**The Ultimate Next-Generation Enterprise Performance Management & Goal Tracking Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

[**Live Demo**](https://atomquest-one.vercel.app) • [**Report Bug**](https://github.com/MBGIRISH/ATOMQUEST/issues) • [**Request Feature**](https://github.com/MBGIRISH/ATOMQUEST/issues)

</div>

---

## 🌟 Overview

**AtomQuest** is a high-performance, enterprise-grade Goal Setting and Tracking Portal built for the modern workforce. Designed with mathematical rigor, seamless role-based workflows, and a stunning UI, it replaces archaic performance reviews with real-time, automated, and shared quarterly check-ins.

This platform was engineered from the ground up for the **Atomberg AtomQuest Hackathon 1.0**.

---

## ⚡ Core Features

### 🔐 1. Strict Role-Based Access Control (RBAC)
Secure, middleware-protected workflows tailored to three core personas:
- **👤 Employees:** Draft, submit, and manage goals. Log quarterly fractional check-ins.
- **💼 Managers:** Approve, reject, or request rework on team goals. Cascade **Shared KPIs** down the hierarchy.
- **👑 Admins / HR:** Oversee organization analytics, monitor SLA escalations, and unlock frozen goals.

### 🎯 2. Intelligent Progress Engine
A sophisticated mathematical goal-tracking engine with multiple Units of Measurement (UoM):
- **Numeric & Percentage:** Standard fractional achievement tracking.
- **Timeline:** Date-driven goal progression.
- **Zero-Based:** Binary edge-case handling (e.g., Target=0, dividing-by-zero protection).

### 🤝 3. Cascading Shared KPIs
Managers can push Master Department KPIs down to their team. Employees inherit these shared goals and can only modify their personal weightage, ensuring **total organizational alignment** while preserving data consistency.

### ⏳ 4. Automated Workflows & SLA Escalation 🏆 *(Bonus Module)*
- **Strict Validation:** Real-time checking to ensure goal weightages exactly equal 100%.
- **Goal Locking:** Approved goals are mathematically frozen to preserve audit integrity.
- **SLA Escalation Engine:** A **Vercel Cron Job** sweeps the PostgreSQL database daily. Goals that miss deadlines or check-ins are automatically flagged, generating an Escalation Ticket visible in a dedicated Admin Dashboard for HR resolution.

### 📊 5. Real-Time Analytics & Exports 🏆 *(Bonus Module)*
- **Interactive Dashboards:** Gorgeous, glassmorphic data visualization for QoQ trends, goal distribution, and achievement matrixes powered by **Recharts**.
- **Live CSV Export:** Download entire department performance reports in one click via live PostgreSQL aggregation.

---

## 🏗️ System Architecture

AtomQuest leverages a fully serverless Edge computing architecture to deliver sub-50ms latency globally.

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

## 💻 Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database:** [PostgreSQL](https://postgresql.org/) (Hosted on Supabase)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Enterprise SSO Mocking)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/), Framer Motion
- **UI Components:** Shadcn UI, Headless UI, Lucide Icons
- **Data Validation:** Zod
- **Infrastructure:** Vercel (Edge Functions & Cron Jobs)

---

## 🔑 Demo Credentials

AtomQuest features an auto-provisioning mock authentication system specifically engineered for rapid Hackathon judging. Simply use the following emails (any password works) to instantly switch between roles:

| Persona | Login Email | Key Journey |
| :--- | :--- | :--- |
| **Admin / HR** | `admin@demo.com` | View Analytics Dashboard & SLA Escalation Queue |
| **Manager** | `manager@demo.com` | Approve team goals & push Shared KPIs |
| **Employee** | `employee@demo.com` | Draft goals & log Quarterly Check-ins |

---

## 🚀 Getting Started

Follow these instructions to run the project locally.

### 1. Clone the Repository
```bash
git clone https://github.com/MBGIRISH/ATOMQUEST.git
cd ATOMQUEST
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
# Required: Supabase or local PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/atomquest"

# Required: Auth Secrets
NEXTAUTH_SECRET="your-super-secret-jwt-encryption-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Push Database Schema
```bash
npx prisma db push
```

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Security & Integrity

AtomQuest was engineered with strict enterprise constraints:
- **Zod Schema Validation:** Every API route rigidly validates incoming payloads. Negative numeric values, missing fields, or weightage overflows are instantly rejected.
- **Prisma Transactions:** Complex operations (like syncing shared KPIs) utilize database-level transaction guarantees.
- **Zero-Trust UI:** Forms remount dynamically to prevent React state caching, and the UI never trusts client-side state without backend verification.

---

<div align="center">
  <p>Built with ❤️ for the AtomQuest Hackathon</p>
</div>
