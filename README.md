# FortifyKitchen Enterprise Monorepo

Welcome to the enterprise-grade monorepo for **FortifyKitchen**, a modern gourmet subscription-based meal prep and food delivery web application.

This repository is strictly modularized using Turborepo, pnpm workspaces, and TypeScript. It implements Feature-First organization on the frontend clients and Domain-Driven Design (DDD Lite) on the backend API server.

---

## 🚀 Product & Business Goals

FortifyKitchen is designed for high-performance healthy food delivery services, offering:
1. **Gourmet Meal Customization**: High-protein dishes designed by professional nutritionists and chefs, categorized by proteins (beef, chicken, shrimp, pork, fish, and vegan).
2. **Flexible Subscription Plans**: Credit-based subscriptions (e.g., restricted by weekly protein gram limits) with variable pricing based on pooled portion consumption.
3. **Automated Order Dispatching**: Real-time admin control panel to accept, prepare, schedule, and complete orders.
4. **In-Stock Inventory Management**: Accurate real-time stock deductions of kitchen-prepared protein portions.

---

## 🛠 Tech Stack

- **Monorepo Management**: [Turborepo](https://turbo.build/) with [pnpm](https://pnpm.io/) workspaces
- **Backend API**: [NestJS](https://nestjs.com/) (TypeScript), [Prisma ORM](https://www.prisma.io/), [Swagger/OpenAPI](https://swagger.io/), [Winston Logger](https://github.com/winstonjs/winston)
- **Frontend Clients**: [Next.js](https://nextjs.org/) (App Router), React 19, [Tailwind CSS v4](https://tailwindcss.com/), [TanStack Query v5](https://tanstack.com/query), [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Neon Serverless PgBouncer connection)
- **Styling & Assets**: Google Fonts (Be Vietnam Pro), FontAwesome Icons, Tailwind CSS v4 variables configuration

---

## 📦 Directory Structure

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

## 🛡️ Database Connection Resilience (Neon Serverless)

The application communicates with a Neon Postgres serverless instance using PgBouncer transaction pooling. Neon's free-tier compute auto-suspends after a brief period of inactivity, causing the connection socket to go stale. The very next query following a wakeup would typically fail with a socket error (`kind: Closed` or `Connection terminated`).

To prevent this from returning `500 Internal Server Error` API responses to users:
- We implemented a Prisma client extension in [@fortifykitchen/database](file:///d:/fortifykitchen/packages/database/src/index.ts) that intercepts these transient socket errors.
- It automatically handles retrying the operation once on a freshly established socket connection, shielding users from database sleep state blips.

---

## 🏁 Quick Start

### Prerequisites
- **Node.js**: `>= 24.0.0` (LTS recommended)
- **Package Manager**: `pnpm >= 9`

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

## 💡 Monorepo Script Directory

- `pnpm run build`: Incremental compilation and bundling of all applications and internal packages.
- `pnpm run dev`: Boots Turborepo dev servers with watch modes.
- `pnpm run lint`: Runs ESLint validation across all directories.
- `pnpm run type-check`: Performs strict compiler typechecking via `tsc --noEmit`.
- `pnpm run format`: Auto-formats code blocks with Prettier.
- `pnpm run db:generate`: Regenerate Prisma Client wrappers.
- `pnpm --filter api test`: Runs Vitest spec tests for API endpoints.
