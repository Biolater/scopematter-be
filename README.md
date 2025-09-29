# 📦 ScopeMatter Backend (API & Core Services)

<p align="center">
  <i>The backend engine enabling freelancers and small agencies to manage projects, prevent scope creep, and formalize change requests.</i>
</p>

<p align="center">
  <img src="../frontend/banner.png" alt="ScopeMatter Banner" width="600" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-6DA55F?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-blue?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Clerk-Auth-orange?style=flat-square&logo=clerk" />
  <img src="https://img.shields.io/badge/Status-In%20Progress-yellow?style=flat-square" />
</p>

---

## ⚙️ Purpose

This repository powers the **ScopeMatter backend**, providing APIs, authentication, and business rules for managing freelance and agency projects. Its mission is to **stop scope creep** and ensure freelancers get paid for every change request.

---

## 🧩 Core Backend Responsibilities

- **Project & Client Management:** Create and organize projects tied to specific clients.
- **Scope Items:** Track and update in-scope deliverables with clear statuses.
- **Requests & Change Orders:** Handle client requests, flag out-of-scope work, and generate formal change orders with pricing/delivery terms.
- **Share Links:** Securely share read-only project views with clients (with granular visibility controls).
- **Dashboard & Insights:** Deliver quick stats, growth metrics, and recent activity feeds for freelancers.
- **Authentication & Security:** Full Clerk integration with robust authorization and request validation.

---

## 🔑 Key Features (Backend)

| Feature                          | Description                                                                 |
|----------------------------------|-----------------------------------------------------------------------------|
| **📂 Project Management**         | Organize projects with associated client details.                           |
| **📝 Scope Tracking**             | Manage scope items and monitor progress (Pending/In Progress/Completed).     |
| **🔄 Request Handling**           | Create, update, and classify requests as in-scope or out-of-scope.          |
| **💰 Change Orders**              | Generate formal out-of-scope agreements with pricing and delivery dates.    |
| **🔗 Shareable Links**            | Secure project-sharing via tokenized links with customizable visibility.    |
| **📊 Dashboard Metrics**          | Aggregated insights on projects, requests, and change orders.               |
| **🔐 Clerk-Based Auth**           | Authentication and ownership enforcement on every API route.                |
| **📑 PDF Exports**                | Export change orders and scopes to professional, client-facing PDFs.        |

---

## 📦 Tech Stack

| Runtime       | Language   | ORM     | Database    | Auth   |
|---------------|------------|---------|-------------|--------|
| Node.js + Express | TypeScript | Prisma  | PostgreSQL  | Clerk  |

---

## 📌 Project Status

> 🛠️ **Actively Developed**  
The backend currently supports the full MVP: projects, clients, scope items, requests, change orders, share links, and dashboard metrics. Current efforts focus on refining exports, scalability, and integrations.

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18  
- npm ≥ 9  
- PostgreSQL running locally or via cloud (e.g., Supabase, Railway)  
- Prisma CLI (`npm install -g prisma`)  
- Clerk account & API keys  

### Setup Instructions

```bash
# 1. Clone the repo
git clone https://github.com/biolater/scopematter.git
cd scopematter/backend

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Add PostgreSQL URI, Clerk API keys, etc.

# 4. Push the schema to your database
npx prisma db push

# 5. Generate the Prisma client
npx prisma generate

# 6. Start the dev server
npm run dev
```

---

## 📖 API Overview

- **Projects:** CRUD operations, tied to client and freelancer.  
- **Scope Items:** CRUD within a project, track deliverables.  
- **Requests:** Log client requests, mark them in/out of scope.  
- **Change Orders:** Create and approve/reject change orders; export as PDFs.  
- **Share Links:** Create, list, revoke, and resolve project share links.  
- **Dashboard:** Aggregate metrics, recent activity, and quick stats.  
- **Public Endpoint:** `GET /public/share/:token` to resolve a read-only project view.  

See `/api/v1/*` for endpoints.

---

## 🛡️ Validation & Error Handling

- **Zod Validation** on all request payloads.  
- **Standardized API Envelope:**  
  ```json
  { "success": true, "data": {...}, "error": null }
  ```  
  ```json
  { "success": false, "data": null, "error": { "message": "Invalid input", "code": "VALIDATION_ERROR" } }
  ```  

---

## 📜 License
This project is currently proprietary and not licensed for external use.  
All rights reserved © 2025 ScopeMatter.
