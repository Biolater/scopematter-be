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
| Persistence    | PostgreSQL + Prisma      | ACID compliance for sensitive financial operations       |
| Authentication | Clerk (Node SDK)         | Stateless JWT verification with tenant isolation         |
| Storage        | Supabase (S3-compatible) | Durable storage for PDFs and project assets              |

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

## 🚀 Getting Started (Local Development)

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
