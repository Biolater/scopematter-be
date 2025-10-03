## PayLynk-BE Backend Context (for AI assistants)

This document summarizes the backend's structure, API routes, controllers, services, domain types, validation schemas, and Prisma models. It is designed to give AI systems enough context to answer questions accurately without scanning the entire codebase.

### Runtime and Entry
- Express app bootstrapped in `src/index.ts`.
- Global middleware: Clerk (`clerkMiddleware`), CORS, Helmet, Morgan, JSON body parsing.
- Auth: `requireAuth` checks Clerk session and loads `AppUser` to `req.user`.
- Error handling: `errorHandler` returns normalized error responses.
- Health check: `GET /health` returns `{ status: "ok" }`.
- Webhook endpoint group: `/webhooks`.
- API base path: `/api/v1`.
- Public endpoints: `/public` for share link access.

### Environment
`src/config/env.ts` exposes:
- `PORT`, `NODE_ENV`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `DATABASE_URL`, `DIRECT_URL`, `CLERK_WEBHOOK_SECRET`, `INTERNAL_API_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `APP_URL`.

### Auth and Request Context
- `src/middleware/auth.ts` uses `@clerk/express` `getAuth(req)` to resolve `userId`.
- Loads `AppUser` from DB and assigns it to `req.user`.
- `types/express/index.d.ts` augments Express Request: `user: AppUser`.

### Response Shape
All controllers use helpers in `src/utils/response.ts`:
- Success: `{ success: true, data: T, error: null, meta: {} }`.
- Error: `{ success: false, data: null, error: { message, code, details? }, meta: {} }`.
- Generic error codes in `src/utils/error-codes.ts`.
- Service error mapping in `src/utils/error-mapper.ts` using `ServiceErrorCodes`.

### Caching
- Redis caching via `src/lib/redis.ts` using Upstash Redis.
- Cache invalidation helpers in `src/lib/cache.ts`.
- Dashboard and project data cached with TTL.
- **Cache Keys**:
  - `dashboard:{userId}` - Dashboard metrics and activity (24h TTL)
  - `projects:{userId}` - Project list with counts (24h TTL)
  - `project:{projectId}` - Individual project details (24h TTL)
  - `share-links:{projectId}` - Share links for a project
- **Cache Invalidation**: Automatic on mutations (create/update/delete operations)
- **Cache Strategy**: Write-through with immediate invalidation on data changes

### Data Model (Prisma)
Defined in `prisma/schema.prisma`:
- Enums:
  - `RequestStatus`: `PENDING | IN_SCOPE | OUT_OF_SCOPE`
  - `ChangeOrderStatus`: `PENDING | APPROVED | REJECTED`
  - `ProjectStatus`: `PENDING | IN_PROGRESS | COMPLETED`
  - `scopeItemStatus`: `PENDING | COMPLETED | IN_PROGRESS`
- Models:
  - `AppUser { id, clerkId (unique), email (unique), firstName?, lastName?, imageUrl?, isActive, projects[], changeOrders[], createdAt, updatedAt }`
  - `Client { id, name, email?, company?, projects[], createdAt, updatedAt }`
  - `Project { id, name, description?, status: ProjectStatus, userId -> AppUser, clientId -> Client, scopeItems[], requests[], changeOrders[], shareLink[], createdAt, updatedAt }`
  - `ScopeItem { id, projectId -> Project, name, description, status: scopeItemStatus, createdAt, updatedAt }`
  - `Request { id, projectId -> Project, description, status: RequestStatus, changeOrder?, createdAt, updatedAt }`
  - `ChangeOrder { id, requestId (unique) -> Request, projectId -> Project, userId -> AppUser, priceUsd Decimal(10,2), extraDays?, status: ChangeOrderStatus, createdAt, updatedAt }`
  - `ShareLink { id, projectId -> Project, tokenHash (unique), expiresAt?, isActive, showScopeItems, showRequests, showChangeOrders, viewCount, lastViewedAt?, revokedAt?, createdAt, updatedAt }`

### API Routes (mounted in `src/index.ts`)
- `/webhooks` → `src/routes/webhook.router.ts`
  - `POST /webhooks/clerk` (raw body) → `handleClerkWebhook` (Clerk events)
- `/api/v1/projects` → `src/routes/project.router.ts` (all require auth)
  - `POST /` create project
  - `GET /` list projects
  - `GET /:id` get project
  - `PUT /:id` update project
  - `DELETE /:id` delete project
  - Nested:
    - `/:projectId/scope-items` → `src/routes/scopeItem.router.ts`
      - `POST /` create scope item
      - `GET /` list scope items
      - `DELETE /:id` delete scope item
      - `PUT /:id` update scope item
      - `GET /export` export scope items as PDF
    - `/:projectId/requests` → `src/routes/request.router.ts`
      - `POST /` create request
      - `GET /` list requests
      - `PUT /:id` update request
      - `DELETE /:id` delete request
    - `/:projectId/change-orders` → `src/routes/changeOrder.router.ts`
      - `POST /` create change order
      - `GET /` list change orders
      - `GET /:id` get change order
      - `PUT /:id` update change order
      - `DELETE /:id` delete change order
      - `GET /:id/export` export change order as PDF
    - `/:projectId/share-link` → `src/routes/shareLink.router.ts`
      - `POST /` create share link
      - `GET /` list share links
      - `DELETE /:id` revoke share link
- `/api/v1/dashboard` → `src/routes/dashboard.router.ts` (auth required)
  - `GET /` get dashboard metrics and activity
- `/public` → `src/routes/public.router.ts`
  - `GET /share/:token` publicly resolves a share token to a read-only project view
- Misc endpoints in `src/index.ts`:
  - `GET /health`
  - `GET /protected` (auth required) returns user context
  - `GET /clerk/:userId` internal util (requires `x-internal-secret`)

### Controllers
- Project: `src/controllers/project.controller.ts`
  - create/get list/get one/update/delete using service layer; injects `req.user.id` and Zod-validated DTOs.
- ScopeItem: `src/controllers/scopeItem.controller.ts`
  - CRUD within a project; validates ownership with `userId`; includes `name` and `status` fields.
  - Export scope items as PDF with project and client details.
- Request: `src/controllers/request.controller.ts`
  - Create/list/update/delete; status can move from `PENDING` to `IN_SCOPE` or `OUT_OF_SCOPE`.
- ChangeOrder: `src/controllers/changeOrder.controller.ts`
  - Create/list/get/update/delete; only for `OUT_OF_SCOPE` requests without existing change order.
  - Export single change order as PDF with project, client, and request details.
- ShareLink: `src/controllers/shareLink.controller.ts`
  - Create share link for a project (auth required).
  - Get all share links for a project (auth required).
  - Revoke a specific share link (auth required).
  - Publicly resolve a share token (no auth) to read-only project summary.
  - Sets security headers (`X-Robots-Tag`, `Cache-Control`) for public share links.
- Dashboard: `src/controllers/dashboard.controller.ts`
  - Get dashboard metrics, activity feed, and quick stats for authenticated user.
- Webhook: `src/controllers/clerk.controller.ts`
  - Verifies Svix signature and calls `upsertAppUser`.

### Services and Core Business Rules
- Project: `src/services/project.service.ts`
  - Create: transactionally creates `Client` then `Project`.
  - Get list: filters by `userId`, includes `client` summary and counts; cached with Redis.
  - Get one: includes `client`, `scopeItems`, `requests` (with nested `changeOrder`), and `changeOrders` (with nested `request`).
  - Update: partial update of `Project` and optionally `Client` fields; strips empty strings to `undefined`; supports `status` updates.
  - Delete: ensures ownership; invalidates related caches.
- ScopeItem: `src/services/scopeItem.service.ts`
  - All operations verify the project belongs to the user.
  - Create: requires `name`, `description`, and `userId`.
  - Update: supports `name`, `description`, and `status` updates.
  - Delete: uses `deleteMany` with project validation.
  - Export: returns project + client + ordered scope items for PDF generation.
- Request: `src/services/request.service.ts`
  - Create: defaults to `PENDING` status; invalidates dashboard cache.
  - Update: allows changing `description` and `status` (validated by Zod); ownership enforced.
  - Delete: ensures ownership before deletion.
- ChangeOrder: `src/services/changeOrder.service.ts`
  - Create: only from `Request` in `OUT_OF_SCOPE`, without existing change order, and owned by user.
  - Update: only when current status is `PENDING`; validates allowed transitions; returns entity with `request` summary.
  - Delete: only when status is `PENDING`.
  - Export: returns project (with client) and the specific change order (with request) for PDF generation.
  - Status transitions: `PENDING` → `APPROVED`/`REJECTED` (final states).
  - Business rules: Only one change order per request, only for out-of-scope requests.
- ShareLink: `src/services/shareLink.service.ts`
  - `createShareLink`: verifies ownership; generates secure token; stores sha256(token) only; returns `CreateShareLinkResponse`.
  - `getShareLink`: validates token, active flag, and expiry; increments `viewCount`/`lastViewedAt`; filters payload by `show*` flags; returns `GetShareLinkResponse`.
  - `getShareLinks`: lists all share links for a project with metadata; returns `ShareLinkListItem[]`.
  - `revokeShareLink`: deactivates a share link by setting `isActive: false` and `revokedAt` timestamp; returns `RevokeShareLinkResponse`.
- Dashboard: `src/services/dashboard.service.ts`
  - Aggregates metrics (projects, scope items, requests, change orders) with growth calculations; cached with Redis.
  - Generates recent activity feed from projects, requests, and change orders.
  - Provides quick stats for completed projects, pending requests, and change order breakdowns.
- Clerk: `src/services/clerk.service.ts`
  - Upsert `AppUser` on user create/update; mark inactive on `user.deleted`.

### Validation Schemas (Zod → inferred TS types)
- Project `src/validation/project.schema.ts`
  - `createProjectSchema`: `{ name: string (1..100), description?: string (<=500), client: { name: string, email?: email, company?: string } }`
  - `updateProjectSchema`: partial; empty strings coerced to `undefined` via union with `""`; includes `status` enum.
  - Types: `CreateProjectSchema`, `UpdateProjectSchema`.
- ScopeItem `src/validation/scopeItem.schema.ts`
  - `createScopeItemSchema`: `{ description: string (1..1000), name: string (1..100) }`
  - `deleteScopeItemSchema`: `{ id: cuid }`
  - `updateScopeItemSchema`: `{ description: string (1..1000), name: string (1..100), status: enum(PENDING | COMPLETED | IN_PROGRESS) }`.
  - Types: `CreateScopeItemSchema`, `DeleteScopeItemSchema`, `UpdateScopeItemSchema`.
- ShareLink `src/validation/shareLink.schema.ts`
  - `createShareLinkSchema`: `{ expiresAt?: date, showScopeItems?: boolean, showRequests?: boolean, showChangeOrders?: boolean }`
  - Types: `CreateShareLinkSchema`.
- Request `src/validation/request.schema.ts`
  - `createRequestSchema`: `{ description: string (1..2000) }`
  - `updateRequestSchema`: `{ description?: string (1..2000), status?: enum(IN_SCOPE | OUT_OF_SCOPE | PENDING) }`.
  - `deleteRequestSchema`: `{ id: string }`.
  - Types: `CreateRequestSchema`, `UpdateRequestSchema`, `DeleteRequestSchema`.
- ChangeOrder `src/validation/changeOrder.schema.ts`
  - `createChangeOrderSchema`: `{ requestId: cuid, priceUsd: number (positive, <= 999999.99, 2 decimals), extraDays?: int(1..365) }`
  - `updateChangeOrderSchema`: all optional; `status` in `PENDING | APPROVED | REJECTED`.
  - Types: `CreateChangeOrderSchema`, `UpdateChangeOrderSchema`.

### Domain Service Input Types (TypeScript)
- Project `src/lib/types/project.ts`
  - `CreateProjectInput`, `GetProjectsInput`, `GetProjectInput`, `DeleteProjectInput`, `UpdateProjectInput`, `ProjectUpdateData`, `ClientUpdateData`.
- ScopeItem `src/lib/types/scopeItem.ts`
  - `CreateScopeItemInput`, `GetScopeItemsInput`, `DeleteScopeItemInput`, `UpdateScopeItemInput`, `ExportScopeItemsInput`.
- Request `src/lib/types/request.ts`
  - `CreateRequestInput`, `GetRequestsInput`, `UpdateRequestInput`, `DeleteRequestInput`.
- ChangeOrder `src/lib/types/changeOrder.ts`
  - `CreateChangeOrderInput`, `GetChangeOrdersInput`, `GetChangeOrderInput`, `UpdateChangeOrderInput`, `DeleteChangeOrderInput`, `ExportChangeOrderInput`.
- Dashboard `src/lib/types/dashboard.ts`
  - `GetDashboardInput`, `GetDashboardOutput`, `DashboardMetrics`, `DashboardActivity`, `DashboardActivityType`, `DashboardQuickStats`.
- ShareLink `src/lib/types/shareLink.ts`
  - Input: `CreateShareLinkInput`, `GetShareLinkInput`, `GetShareLinksInput`, `RevokeShareLinkInput`.
  - Output: `CreateShareLinkResponse`, `GetShareLinkResponse`, `ShareLinkListItem`, `RevokeShareLinkResponse`, `ShareLinkPermissions`.

### Response Types and Error Handling
- **Success Response**: `{ success: true, data: T, error: null, meta: {} }`
- **Error Response**: `{ success: false, data: null, error: { message, code, details? }, meta: {} }`
- **Error Details**: Array of `{ field: string, message: string }` for validation errors
- **Service Error Codes**: Domain-specific error codes mapped to HTTP status codes
- **Generic Error Codes**: Standard HTTP error codes for common scenarios

### Prisma Types (from `@prisma/client`)
- Models: `AppUser`, `Client`, `Project`, `ScopeItem`, `Request`, `ChangeOrder`, `ShareLink`.
- Enums: `RequestStatus`, `ChangeOrderStatus`, `ProjectStatus`, `scopeItemStatus`.

### Middleware and Utilities
- `requireAuth` ensures `req.user: AppUser` and `401/404` otherwise.
- `validateBody(schema)` applies Zod validation and formats errors via `formatZodError`.
- `errorHandler` maps unhandled errors to a generic `500`.
- `handleServiceError` maps domain errors to HTTP errors using `ServiceErrorCodes`.

### Global Middleware Stack
- **Clerk Middleware**: `clerkMiddleware` with publishable and secret keys
- **CORS**: Cross-origin resource sharing enabled
- **Helmet**: Security headers for HTTP protection
- **Morgan**: HTTP request logging in development
- **JSON Body Parser**: Parses JSON request bodies
- **Raw Body Parser**: For webhook endpoints (Clerk requires raw body)

### Utility Functions
- `src/utils/response.ts`: Standardized response helpers (`sendSuccess`, `sendError`) with consistent shape.
- `src/utils/error-codes.ts`: Generic error codes (`UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, etc.).
- `src/utils/service-error-codes.ts`: Domain-specific error codes for business logic validation.
- `src/utils/service-error.ts`: `ServiceError` class for domain error handling.
- `src/utils/error-mapper.ts`: Maps `ServiceError` codes to HTTP responses with appropriate status codes.
- `src/utils/zod-error.ts`: Formats Zod validation errors into structured error details.
- `src/utils/share-link.ts`: Generates secure share tokens using `randomBytes` and SHA256 hashing.
- `src/utils/date.ts`: Date utilities (`getStartOfMonth`, `getStartOfWeek`) for dashboard metrics.

### Endpoint Reference (concise)
- Projects
  - `POST /api/v1/projects` body: `CreateProjectSchema` → Project
  - `GET /api/v1/projects` → Project[] (summary with counts)
  - `GET /api/v1/projects/:id` → Project (expanded)
  - `PUT /api/v1/projects/:id` body: `UpdateProjectSchema` → Project
  - `DELETE /api/v1/projects/:id` → deleted Project
- Scope Items
  - `POST /api/v1/projects/:projectId/scope-items` body: `CreateScopeItemSchema` → ScopeItem
  - `GET /api/v1/projects/:projectId/scope-items` → ScopeItem[]
  - `DELETE /api/v1/projects/:projectId/scope-items/:id` → `{ id }`
  - `PUT /api/v1/projects/:projectId/scope-items/:id` body: `UpdateScopeItemSchema` → ScopeItem
  - `GET /api/v1/projects/:projectId/scope-items/export` → PDF stream
- Requests
  - `POST /api/v1/projects/:projectId/requests` body: `CreateRequestSchema` → Request
  - `GET /api/v1/projects/:projectId/requests` → Request[]
  - `PUT /api/v1/projects/:projectId/requests/:id` body: `UpdateRequestSchema` → Request
  - `DELETE /api/v1/projects/:projectId/requests/:id` → deleted Request
- Change Orders
  - `POST /api/v1/projects/:projectId/change-orders` body: `CreateChangeOrderSchema` → ChangeOrder
  - `GET /api/v1/projects/:projectId/change-orders` → ChangeOrder[] (with request summary)
  - `GET /api/v1/projects/:projectId/change-orders/:id` → ChangeOrder (with request summary)
  - `PUT /api/v1/projects/:projectId/change-orders/:id` body: `UpdateChangeOrderSchema` → ChangeOrder
  - `DELETE /api/v1/projects/:projectId/change-orders/:id` → deleted ChangeOrder
  - `GET /api/v1/projects/:projectId/change-orders/:id/export` → PDF stream
- Share Links
  - `POST /api/v1/projects/:projectId/share-link` body: `CreateShareLinkSchema` → `CreateShareLinkResponse`
  - `GET /api/v1/projects/:projectId/share-link` → `ShareLinkListItem[]`
  - `DELETE /api/v1/projects/:projectId/share-link/:id` → `RevokeShareLinkResponse`
  - `GET /public/share/:token` → `GetShareLinkResponse` (public project view)
- Dashboard
  - `GET /api/v1/dashboard` → Dashboard metrics, recent activity, and quick stats
- Webhooks
  - `POST /webhooks/clerk` raw JSON, Svix headers required

### Notes for AI Usage
- Always assume endpoints require Clerk auth unless explicitly public (e.g., health, webhook, public share links).
- Use `ErrorCodes` and `ServiceErrorCodes` to map domain errors to client-facing messages.
- Use Zod schemas as the source of truth for request validation and shape.
- Prisma relations enforce ownership and on-delete cascades as per schema.
- Redis caching is used for dashboard and project data; cache invalidation happens on mutations.
- Share links use secure token generation with SHA256 hashing; only hashes are stored in DB.
- PDF exports are generated using PDFKit for scope items and change orders.
- All service functions have explicit return type annotations for better TypeScript support.

### Business Logic Rules
- **Project Ownership**: All operations verify project belongs to authenticated user
- **Change Order Eligibility**: Only `OUT_OF_SCOPE` requests without existing change orders
- **Status Transitions**: 
  - Requests: `PENDING` → `IN_SCOPE`/`OUT_OF_SCOPE`
  - Change Orders: `PENDING` → `APPROVED`/`REJECTED` (final states)
  - Projects: `PENDING` → `IN_PROGRESS` → `COMPLETED`
  - Scope Items: `PENDING` → `IN_PROGRESS` → `COMPLETED`
- **Data Integrity**: All mutations use Prisma transactions for consistency
- **Security**: Share tokens are never stored in plain text, only SHA256 hashes
- **Validation**: Empty strings are coerced to `undefined` in update operations

### PDF Export Features
- **Scope Items Export**: `GET /api/v1/projects/:projectId/scope-items/export`
  - Generates branded PDF with project details, client info, and ordered scope items.
  - Includes ScopeMatter watermark and footer branding.
  - Filename: `project-{projectId}-scope.pdf`
- **Change Order Export**: `GET /api/v1/projects/:projectId/change-orders/:id/export`
  - Generates branded PDF with project details, client info, request details, and change order specifics.
  - Includes pricing, extra days, status, and creation date.
  - Filename: `change-order-{id}.pdf`
- Both exports use PDFKit with consistent styling and error handling for missing logo files.

### Additional Endpoints
- `GET /clerk/:userId` (internal utility)
  - Requires `x-internal-secret` header matching `INTERNAL_API_SECRET`
  - Returns Clerk user data and JWT token for testing
  - Used for development/testing purposes
- `GET /protected` (auth required)
  - Returns user context for testing authentication