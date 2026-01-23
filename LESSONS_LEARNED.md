# Post-Mortem & Lessons Learned

> "Failure is data. We document it to ensure we never pay the same tuition check twice."

---

## 🏗️ Architectural Trade-off: The "Monolith" vs. "Microservices"

- **Hypothesis**: We should build microservices to scale independent modules.
- **Reality Check**: For a team of 1 (The Sovereign Engineer), the operational overhead of microservices (network latency, distributed tracing, deployment complexity) is a liability.
- **Lesson**: We chose a **Modular Monolith**. We get code isolation via proper folder structure (`src/modules/*`) without the deployment nightmare. "Scale via Code, not via Network."

## 🔧 The "Optimistic Concurrency" Trap

- **The Issue**: Users fast-clicking "Approve" on a Change Order could trigger double-writes.
- **The Fix**: We attempted to use DB locks, but it hurt performance.
- **Resolution**: We relied on Prisma's `@updatedAt` checks and strict Status State Machine logic. If `status !== PENDING`, the second write fails immediately. Simple, robust, fast.

## 🐳 Docker Permissions on Windows

- **The Struggle**: Ensuring `node_modules` synced correctly between the Windows Host and the Linux Container.
- **The Fix**: Explicitly using `USER node` inside the Dockerfile and ensuring `docker-compose` volumes don't overwrite the internal `node_modules` build folder.
- **Takeaway**: Always separate "Dev Volumes" (src code) from "Build Volumes" (dependencies).

## 🛡️ The "AI Orchestrator" Shift

- **Observation**: Initially, I let AI "suggest" architecture. It suggested generic CRUD.
- **Correction**: I switched to **Directive Prompting**. I defined the _Constraint_ ("Must be immutable", "Must use Zod"), and the AI built the _Implementation_.
- **Lesson**: AI is a terrible Architect but an amazing Mason. The "Principal Engineer" must remain human.
