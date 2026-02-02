# ScopeMatter Backend | Deterministic Scope & Change Order Engine

**The Pitch**  
A high-integrity financial state machine designed to eliminate freelance scope creep by formalizing the transition from informal client requests into binding, auditable financial agreements.

---

## 🚀 The Core Problem

Most project management backends fail because they treat tasks as simple *to-do* items rather than contractual obligations.

**ScopeMatter Backend** solves this by:

- **State-Enforced Billing:**  
  Prevents unbilled work by making change orders programmatically mandatory for any out-of-scope task.

- **Relational Integrity:**  
  Guarantees that every dollar and every hour added to a project is linked to a specific, triaged client request.

---

## 🛠️ Technical Sophistication

### 1. Deterministic Financial State Machine

Managed the lifecycle of Change Orders using a rigid state machine.  
This prevents financial leakage by ensuring a `Request` can only transition into a `ChangeOrder` if explicitly triaged as `OUT_OF_SCOPE`, and that pricing data becomes immutable once reaching the terminal `APPROVED` state.

---

### 2. Transactional Atomicity

Implemented strict Prisma transactions for complex mutations (e.g., converting a Request into a Change Order).  
This guarantees **all-or-nothing** behavior, preventing orphaned records or corrupted project balances during high-concurrency operations.

---

### 3. Sovereign Security Model

Engineered a secure public-access layer using **SHA-256 token hashing** for project ShareLinks.  
This enables stakeholders to view live project data without full accounts while preventing URL guessing and unauthorized data exposure.

---

## 🏗️ Architecture & Logic

- **Entry Layer:**  
  Layered monolithic REST API with centralized middleware for authentication and request logging.

- **Security Model:**  
  Clerk-based identity verification combined with resource-level authorization (organization isolation) enforced on every database query.

- **Validation Layer:**  
  End-to-end type safety via Zod schemas at controller boundaries, ensuring zero malformed data reaches the service layer.

- **Persistence:**  
  PostgreSQL with Prisma ORM, using `DECIMAL(10,2)` for all financial fields to eliminate floating-point precision errors.

---

## 🧰 Technology Ecosystem

| Component | Choice              | Rationale                                                     |
|---------|---------------------|---------------------------------------------------------------|
| Runtime | Node.js (TypeScript) | Optimized for async I/O and rapid iteration                   |
| Database | PostgreSQL          | Enforces relational integrity for financial data              |
| ORM     | Prisma              | Type-safe queries and migrations                              |
| Security | SHA-256 / Clerk     | Industry-standard hashing and identity management             |

---

## 📈 Impact & Achievements

- Architected a deterministic state machine enforcing financial correctness and preventing orphaned revenue records
- Engineered a sovereign public-access security model using SHA-256 token hashing
- Enforced **100% end-to-end type safety** by synchronizing Prisma schemas with Zod validation boundaries
- Reduced dashboard read latency via selective field querying and optimized multi-tenant indexing

---

## 💻 Local Setup

```bash
# Clone the repository
git clone https://github.com/Biolater/scopematter-be

# Install dependencies
pnpm install

# Environment variables
cp .env.example .env

# Database migration
npx prisma migrate dev

# Run locally
pnpm dev
