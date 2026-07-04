# FortifyKitchen Enterprise Monorepo

Welcome to the enterprise-grade monorepo for the **Food Ordering & Subscription Application**.

This workspace is designed to scale across multiple years with strict modularization, Domain-Driven Design (DDD Lite) on the backend, and Feature-First organizations on the frontend.

## Tech Stack Overview

- **Monorepo**: Turborepo, pnpm workspaces, TypeScript
- **Backend**: NestJS, Prisma ORM, PostgreSQL (Neon), Swagger/OpenAPI, Winston logger, Helmet
- **Frontend**: Next.js (App Router), React 19, Tailwind CSS v4, TanStack Query, React Hook Form, Zod, Lucide Icons, Framer Motion
- **Shared Libraries**: `@fortifykitchen/ui` (components), `@fortifykitchen/database` (Prisma client), `@fortifykitchen/config` (environment validation), `@fortifykitchen/types`, `@fortifykitchen/utils`, `@fortifykitchen/shared`

## Monorepo Layout

```text
apps/
├── customer-web/      # Next.js Customer Web Application
├── admin-dashboard/   # Next.js Admin Management Console
└── api/               # NestJS REST API Server

packages/
├── tsconfig/          # Shared tsconfig bases
├── eslint-config/     # Shared ESLint 9 configs
├── ui/                # Shared Tailwind v4 UI library
├── database/          # Prisma schema, client, migrations, seeding
├── types/             # Shared TypeScript types
├── utils/             # Pure utility helpers
├── config/            # Environment variable validations
└── shared/            # Common API clients, routes, constants
```

## Quick Start

### Prerequisites
- Node.js >= 24 LTS
- pnpm >= 9

### Installation & Initialization
1. Clone the repository and navigate to root:
   ```bash
   pnpm install
   ```
2. Set up local configurations:
   Create `.env` file in the root (and in `apps/api/.env` if needed):
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

3. Setup Database (Prisma Client generation & migrations):
   ```bash
   pnpm run db:generate
   pnpm run db:push
   ```

4. Launch dev servers:
   ```bash
   pnpm run dev
   ```

## Available Workspace Scripts

- `pnpm run build`: Build all applications and packages incrementally.
- `pnpm run dev`: Boot all services in watch mode.
- `pnpm run lint`: Lint the entire monorepo.
- `pnpm run type-check`: Perform strict static type-checking.
- `pnpm run format`: Auto-format all code blocks using Prettier.
- `pnpm run db:generate`: Regenerate the Prisma Client.
