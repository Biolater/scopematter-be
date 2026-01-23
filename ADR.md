# Architectural Decision Record (ADR) Log

> "We don't chose technologies because they are popular; we choose them because they solve specific constraints."

---

## ADR-001: Type-Safe ORM (Prisma) vs. Raw SQL
*   **Status**: Accepted
*   **Context**: The domain involves complex relational integrity: `Project` -> `Requests` -> `ChangeOrders` -> `AppUsers`. Raw SQL offers speed but introduces "magic string" fragility.
*   **Decision**: Use **Prisma ORM**.
*   **Consequences**:
    *   (+) **Type Safety**: The Schema is the single source of truth. DB Types flow automatically to the API Layer (Zod).
    *   (+) **Velocity**: Migrations are code-managed.
    *   (-) **Performance**: Slightly higher cold-start time (mitigated by Connection Pooling).

## ADR-002: Write-Through Caching (Redis)
*   **Status**: Accepted
*   **Context**: Calculating "Dashboard Growth Metrics" on every page load is O(n^2) expensive as data grows.
*   **Decision**: Implement **Write-Through Caching** via Upstash Redis.
*   **Consequences**:
    *   (+) **Speed**: Dashboard loads in <50ms (O(1)).
    *   (-) **Complexity**: Every "Write" (Create Project) must explicitly invalidate the "Read" cache key.

## ADR-003: Sovereign Hashing for Share Links
*   **Status**: Accepted
*   **Context**: Public links (`scopematter.com/share/xyz`) bypass Auth guards. If the DB is leaked, raw tokens would expose private client data.
*   **Decision**: Store only **SHA-256 Hashes** of tokens.
*   **Consequences**:
    *   (+) **Security**: A DB dump is useless to an attacker.
    *   (-) **UX**: Lost tokens cannot be recovered; they must be revoked and regenerated.

## ADR-004: Containerized Sovereignty (Docker)
*   **Status**: Accepted
*   **Context**: "It works on my machine" is an unacceptable failure mode for a Trust Engine.
*   **Decision**: Use **Multi-Stage Docker Builds** with `docker-compose`.
*   **Consequences**:
    *   (+) **Immutability**: Dev, CI, and Prod environments are mathematically identical.
    *   (+) **Security**: The app runs as a non-root user (`node`).
    *   (-) **DevEx**: Requires Docker Desktop for local development.
