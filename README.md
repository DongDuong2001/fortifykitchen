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

---

## Directory Structure

```text
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

## Database Connection Resilience and Synchronization

### Neon Serverless Connection Handling
The application communicates with a Neon Postgres instance using PgBouncer transaction pooling. Neon's free-tier compute auto-suspends after a brief period of inactivity, causing the connection socket to go stale. The very next query following a wakeup would typically fail with a socket error (`kind: Closed` or `Connection terminated`).

To prevent this from returning 500 Internal Server Error API responses to users, we implemented a Prisma client extension in @fortifykitchen/database (packages/database/src/index.ts) that intercepts these transient socket errors and automatically retries the operation once on a freshly established socket connection.

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
BETTER_AUTH_SECRET="super-secret-better-auth-signing-key-12345678"
BETTER_AUTH_URL="http://localhost:4000"
THROTTLE_TTL=60
THROTTLE_LIMIT=100
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

- pnpm run build: Incremental compilation and bundling of all applications and internal packages.
- pnpm run dev: Boots Turborepo dev servers with watch modes.
- pnpm run lint: Runs ESLint validation across all directories.
- pnpm run type-check: Performs strict compiler typechecking via tsc --noEmit.
- pnpm run format: Auto-formats code blocks with Prettier.
- pnpm run db:generate: Regenerate Prisma Client wrappers.
- pnpm --filter api test: Runs Vitest spec tests for API endpoints.
