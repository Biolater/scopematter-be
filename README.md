# ScopeMatter Backend API

## 🧠 Engineering Cognition (Domain Architecture)

This API is architected for **strict reliability**.
Every decision prioritizes **data immutability**, **financial correctness**, and **state consistency** across the entire system.

> **Important**
> 📘 **Read the [ARCHITECTURE.md](./ARCHITECTURE.md)**
> This document explains the _Mirror Side_ of ScopeMatter, including:
>
> - Database transaction safety
> - Stateless JWT validation at the edge
> - PDF engine orchestration and export guarantees

---

## 💼 Compliance & Value Proposition

**"Senior Engineering at 30% Higher Efficiency"**

*   **Global Compliance**: I operate as a **W-8BEN Compliant International Contractor**, fully eligible for simplified cross-border engagement with US/EU entities.
*   **Fiscal Efficiency**: Based in Azerbaijan (Tax-Exempt Technology Zone), effectively reducing your total cost of employment by **20-30%** compared to equivalent W-2 hires (no payroll tax, no benefits overhead).
*   **Timezone Leverage**: GMT/UTC+4 allows for a "Follow the Sun" workflow—I resolve critical blocks while your core team sleeps, enabling zero-latency handoffs.

---

## 🧩 Domain Responsibilities

This service acts as the **single source of truth** for the ScopeMatter ecosystem.

It is responsible for:

- **State Management**
  Enforcing the strict 3-state workflow:
  `Requested → Classified → Approved`

- **Relational Integrity**
  Managing deep relationships between:
  - Freelancers
  - Clients
  - Projects
  - Nested scope items and revisions

- **Financial Reconciliation**
  Generating **immutable Change Orders** with:
  - Cryptographic identifiers
  - Share-safe, client-facing access tokens
  - Audit-ready data snapshots

- **Document Orchestration**
  A dedicated PDF engine that converts domain data into:
  - Professional contracts
  - Change order documents
  - Financial summaries suitable for audits and disputes

---

## 🏗️ Technical Stack & Sovereign Patterns

| Layer          | Technology               | Rationale                                                |
| -------------- | ------------------------ | -------------------------------------------------------- |
| Runtime        | Node.js + TypeScript     | Type-safe domain logic from request to persistence       |
| API Framework  | Express.js               | Lightweight, explicit, and optimized for JSON throughput |
| Persistence    | PostgreSQL + Prisma      | ACID compliance (Hosted on Supabase)                     |
| Authentication | Clerk (Node SDK)         | Stateless JWT verification with tenant isolation         |
| PDF Engine     | PDFKit                   | On-demand generation of immutable contracts              |
| Infrastructure | Docker + Compose         | Containerized sovereignty for consistent environments    |

---

## 🛡️ API Governance & Security

### 1. Standardized Response Envelope

All endpoints follow a strict normalization contract to act as a **trust engine** for any consumer:

```json
{
  "success": true,
  "data": {
    "id": "proj_123",
    "status": "active"
  },
  "error": null
}
```

This guarantees predictable frontend behavior and simplifies error handling across platforms.

---

### 2. Guarded State Transitions

This API is not CRUD-driven.
Every state mutation is **explicitly guarded** by domain rules:

- **Ownership Verification**
  The authenticated `clerkId` must match the project owner.

- **Schema Validation**
  All inputs are strictly validated using Zod before persistence.

- **Atomic Operations**
  Complex workflows (e.g. Change Order creation) execute inside Prisma transactions to prevent partial writes or financial corruption.

---

## 🌐 Distributed System Notice

This repository contains the **Domain API** only.

- **Frontend Layer**
  👉 [https://github.com/Biolater/scopematter](https://github.com/Biolater/scopematter)

- **Design Principle**
  This API is:
  - Stateless
  - Horizontally scalable
  - Interface-agnostic

It can serve web, mobile, or CLI clients without modification.

---

## 🚀 Orchestration & Sovereignty

The system supports two modes of execution: **Bare Metal** (Node Direct) and **Sovereign Container** (Docker).

### Option A: Sovereign Container (Recommended)
*Ensures strict environment parity with production.*

```bash
# Spin up the entire Trust Engine (API + Redis + Postgres Emulator)
docker-compose up --build
```

### Option B: Bare Metal (Dev Mode)
*For rapid feature iteration.*

### 1. Clone the Repository

```bash
git clone https://github.com/biolater/scopematter-be.git
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

```bash
cp .env.example .env
```

**Core & Database**
- `DATABASE_URL`: Connection string for PostgreSQL (Pooled)
- `DIRECT_URL`: Direct connection string for migrations
- `PORT`: (Optional) Defaults to 5000
- `APP_URL`: The frontend URL (for CORS/Links)

**Authentication (Clerk)**
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`: For verifying Clerk webhooks

**Caching (Upstash Redis)**
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**Security**
- `INTERNAL_API_SECRET`: For internal utility endpoints

---

### 4. Sync Database

```bash
npx prisma db push
npx prisma generate
```

---

### 5. Launch Development Server

```bash
npm run dev
```

The API will boot in development mode with hot reload enabled.

---

## 🧠 Final Note

ScopeMatter’s backend is intentionally **opinionated**.
It favors correctness, traceability, and long-term maintainability over speed of shortcuts.

If you are reading this, you are looking at a system designed to **hold up under disputes, audits, and scale** — not demos.

---

## 🤖 Transparency & Disclosure: Proof of Autonomy

This architecture was co-designed with **Advanced Agentic AI** under strict Human Governance.

*   **Human Role (The Architect)**: Defined the Business Logic (Scope Creep Defense), Security Constraints (Auth Gates), and "Trust" Axioms.
*   **AI Role (The Builder)**: Generated the Docker scaffolding, CI/CD pipelines, and boilerplate implementation patterns.
*   **Verification**: 100% of code has been audited, tested, and verified by Human Intelligence.

> **"AI is the hammer, not the carpenter."**
