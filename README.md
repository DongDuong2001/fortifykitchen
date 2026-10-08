# FortifyKitchen Enterprise Monorepo

Welcome to the enterprise-grade monorepo for FortifyKitchen, a modern gourmet subscription-based meal prep and food delivery web application.

This repository is strictly modularized using Turborepo, pnpm workspaces, and TypeScript. It implements Feature-First organization on the frontend clients and Domain-Driven Design (DDD Lite) on the backend API server.

---

## Product and Business Goals

FortifyKitchen is designed for high-performance healthy food delivery services, offering:

1. Gourmet Meal Customization: High-protein dishes designed by professional nutritionists and chefs, categorized by proteins (beef, chicken, shrimp, pork, fish, and vegan).
2. Flexible Subscription Plans: Credit-based subscriptions (restricted by weekly protein gram limits) with variable pricing based on pooled portion consumption.
3. Automated Order Dispatching: Real-time admin control panel to accept, prepare, schedule, and complete orders.
4. In-Stock Inventory Management: Accurate real-time stock deductions of kitchen-prepared protein portions.

---

## Tech Stack

- Monorepo Management: Turborepo with pnpm workspaces
- Backend API: NestJS (TypeScript), Prisma ORM, Swagger/OpenAPI, Winston Logger
- Frontend Clients: Next.js (App Router), React 19, Vanilla CSS variables, TanStack Query v5, React Hook Form, Zod
- Database: PostgreSQL (Neon Serverless PgBouncer connection)
- Styling and Assets: Google Fonts (Inter, Be Vietnam Pro), FontAwesome Icons
- Authentication: Neon Auth (JWKS-based JWT verification) with fallback HMAC JWT
- Deployment: Render (API, Admin Dashboard, Cron Jobs), Vercel (Customer Web), Neon (Database)

---

## Directory Structure

```
apps/
├── customer-web/      # Next.js customer portal (ordering, tracking, subscription dashboard)
├── admin-dashboard/   # Next.js administration panel (orders dispatch, stock catalog, discount promos)
└── api/               # NestJS REST API server (business logic, controllers, database services)

packages/
├── tsconfig/          # Base TypeScript configurations
├── eslint-config/     # Base ESLint linting rules
├── ui/                # Shared React UI components library (Dialogs, Toasts, etc.)
├── database/          # Prisma database client, schema definitions, and migration seeds
├── types/             # Shared TypeScript type definitions
├── utils/             # Pure utility helpers
├── config/            # Environment variable schema validations
└── shared/            # Common API clients, routes, pricing rules, and constants
```

---

## Deployment Architecture

### Production Services

| Service | Platform | URL | Region |
|---------|----------|-----|--------|
| API (NestJS) | Render | https://fortifykitchen-api.onrender.com | Singapore |
| Admin Dashboard (Next.js) | Render | https://fortifykitchen.onrender.com | Global |
| Customer Web (Next.js) | Vercel | https://fortifykitchen.vercel.app | Global (Vercel Edge) |
| Database (PostgreSQL) | Neon | (Neon connection string) | Asia Pacific |

### Environment Variables

Required environment variables for production:

**API (Render)**
- DATABASE_URL: Neon PostgreSQL connection string
- JWT_SECRET: 32+ character secret for HMAC JWT signing
- JWT_REFRESH_SECRET: 32+ character secret for refresh tokens
- CRON_SECRET: 32+ character secret for cron job authentication
- NEON_AUTH_JWKS_URL: Neon Auth JWKS endpoint
- NEON_AUTH_AUDIENCE: Expected audience claim (optional)
- NEON_AUTH_ISSUER: Expected issuer claim (optional)
- CLOUDINARY_CLOUD_NAME: Cloudinary account name
- CLOUDINARY_API_KEY: Cloudinary API key
- CLOUDINARY_API_SECRET: Cloudinary API secret
- FRONTEND_URL: https://fortifykitchen.onrender.com
- CUSTOMER_WEB_URL: https://fortifykitchen.vercel.app

**Admin Dashboard (Render)**
- NEXT_PUBLIC_API_URL: https://fortifykitchen-api.onrender.com
- NEXT_PUBLIC_APP_URL: https://fortifykitchen.onrender.com

**Customer Web (Vercel)**
- NEXT_PUBLIC_API_URL: https://fortifykitchen-api.onrender.com
- NEXT_PUBLIC_APP_URL: https://fortifykitchen.vercel.app

### Cron Jobs (Render)

All cron jobs run in Singapore region and target the API service:

| Job | Schedule | Endpoint |
|-----|----------|----------|
| Subscription Renewal | Daily 02:00 UTC | POST /api/cron/subscriptions/renew |
| Session Cleanup | Daily 03:00 UTC | POST /api/cron/sessions/cleanup |
| Order Cleanup | Daily 04:00 UTC | POST /api/cron/orders/cleanup |
| Weekly Subscription Sync | Sunday 05:00 UTC | POST /api/cron/subscriptions/sync |
| Health Check / Keep-alive | Hourly | GET /api/health |
| Admin Data Sync | Daily 06:00 UTC | POST /api/cron/admin/sync |

### Database Maintenance (Neon pg_cron)

Run `neon-cron-jobs.sql` in Neon SQL Editor to enable:
- Daily session cleanup (30 days retention)
- Weekly old order cleanup (2 years retention)
- Hourly subscription renewal via API call
- Weekly VACUUM ANALYZE

---

## Database Connection Resilience and Synchronization

### Neon Serverless Connection Handling

The application communicates with a Neon Postgres instance using PgBouncer transaction pooling. Neon's free-tier compute auto-suspends after a brief period of inactivity, causing the connection socket to go stale. The very next query following a wakeup would typically fail with a socket error (`kind: Closed` or `Connection terminated`).

To prevent this from returning 500 Internal Server Error API responses to users, we implemented a Prisma client extension in `@fortifykitchen/database` (packages/database/src/index.ts) that intercepts these transient socket errors and automatically retries the operation once on a freshly established socket connection.

### Synchronization and Troubleshooting (Windows EPERM error)

When applying database schema updates, Prisma regenerates client assets. On Windows, if the NestJS API server (`api`) or Next.js dev servers are running, they hold an exclusive lock on the Prisma query engine file (`query_engine-windows.dll.node`), which results in an `EPERM` file operation error.

To safely push database changes and avoid this:

1. Stop all running dev servers (Press Ctrl+C in all active terminals).
2. Push database schema modifications:
   ```bash
   pnpm --filter @fortifykitchen/database exec prisma db push
   # Or with data loss approval if changing core tables:
   pnpm --filter @fortifykitchen/database exec prisma db push --accept-data-loss
   ```
3. Regenerate and compile client packages:
   ```bash
   pnpm --filter @fortifykitchen/database db:generate
   pnpm --filter @fortifykitchen/database build
   ```
4. Restart development servers:
   ```bash
   pnpm run dev
   ```

---

## Quick Start

### Prerequisites
- Node.js: >= 24.0.0 (LTS recommended)
- Package Manager: pnpm >= 9

### 1. Installation

Clone the repository and install all dependencies from the root:

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root workspace directory with the following variables:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://user:pass@localhost:5432/fortifykitchen?schema=public"
JWT_SECRET="super-secret-jwt-signing-key-12345678"
JWT_REFRESH_SECRET="super-secret-refresh-key-12345678"
BETTER_AUTH_SECRET="super-secret-better-auth-signing-key-12345678"
BETTER_AUTH_URL="http://localhost:4000"
THROTTLE_TTL=60
THROTTLE_LIMIT=100
CRON_SECRET="super-secret-cron-key-12345678"
NEON_AUTH_JWKS_URL="https://your-neon-auth-endpoint.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json"
NEON_AUTH_AUDIENCE="your-audience"
NEON_AUTH_ISSUER="https://your-neon-auth-endpoint.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 3. Setup Database Schema

Generate the Prisma client code and push the schema definitions to your database:

```bash
pnpm run db:generate
pnpm run db:push
```

### 4. Boot Dev Servers

Run the development environment (API server, customer portal, and admin panel simultaneously in watch mode):

```bash
pnpm run dev
```

---

## Monorepo Script Directory

- `pnpm run build`: Incremental compilation and bundling of all applications and internal packages.
- `pnpm run dev`: Boots Turborepo dev servers with watch modes.
- `pnpm run lint`: Runs ESLint validation across all directories.
- `pnpm run type-check`: Performs strict compiler typechecking via tsc --noEmit.
- `pnpm run format`: Auto-formats code blocks with Prettier.
- `pnpm run db:generate`: Regenerate Prisma Client wrappers.
- `pnpm --filter api test`: Runs Vitest spec tests for API endpoints.

---

## Project Conventions

### Git Discipline
- Never commit directly to `main` or `ui-testing`. Use dedicated `feature/*` branches.
- Commit after each completed, working feature. Do not batch multiple features into one commit.
- Small, scoped, Conventional Commit messages: `feat(api): ...`, `fix(admin-dashboard): ...`, `chore(db): ...`.
- Stage deliberately (`git add <specific files>`), not `git add -A`.

### TypeScript
- Strict mode enabled across all packages.
- No `any` types in new code. Use `unknown` with type guards.
- Shared types live in `packages/types/src/index.ts`.

### API Design
- RESTful endpoints with proper HTTP status codes.
- Swagger documentation at `/docs`.
- Global validation pipes with `whitelist: true`, `forbidNonWhitelisted: true`.
- Rate limiting via `@nestjs/throttler`.

### Frontend
- Feature-first organization in `apps/*/src/features/`.
- TanStack Query for server state management.
- React Hook Form + Zod for form validation.
- CSS variables for theming (no CSS-in-JS).

---

## License

Copyright (c) 2024-2025 FortifyKitchen. All rights reserved.

This project is proprietary and confidential. Unauthorized copying, distribution, modification, or use of this software, via any medium, is strictly prohibited without explicit written permission from the copyright holder.

This software is provided "as is" without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and noninfringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use or other dealings in the software.