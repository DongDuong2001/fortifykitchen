# Developer Setup & Local Startup Guide

Follow this guide to configure and verify your local monorepo development environment.

---

## 1. Initial Workspace Prep

### Tools Installation
Install Node 24 and the package manager pnpm:
```bash
# Verify versions
node -v   # Target: >=24.0.0
pnpm -v   # Target: >=9.0.0
```

### Install Dependencies
Run from the root directory to download and resolve workspace linkages:
```bash
pnpm install
```

---

## 2. Environment Variables Checklist

Configure a `.env` file at the root. The configurations are verified at start using Zod:

```env
# Server
NODE_ENV=development
PORT=4000

# Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fortifykitchen?schema=public"

# Auth Secrets
JWT_SECRET="generate-a-long-random-string-at-least-32-chars-long"
BETTER_AUTH_SECRET="generate-another-long-random-string-at-least-32-chars-long"
BETTER_AUTH_URL="http://localhost:4000"

# Rate Limiter
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

---

## 3. Database Migration & Provisioning

Once PostgreSQL is running locally (or using Neon), run these commands:

1. **Push schema changes**:
   ```bash
   pnpm run db:push
   ```
   *This syncs the PostgreSQL database with the models defined in `packages/database/prisma/schema.prisma`.*

2. **Generate client types**:
   ```bash
   pnpm run db:generate
   ```
   *This generates typescript bindings in the client libraries.*

3. **Database Seeding**:
   To seed default categories and the admin profile:
   ```bash
   pnpm --filter @fortifykitchen/database exec prisma db seed
   ```

---

## 4. Run Development Servers

Launch all Next.js applications and the NestJS API simultaneously using:
```bash
pnpm run dev
```

Turborepo will automatically boot:
- **NestJS API Server**: [http://localhost:4000/docs](http://localhost:4000/docs) (Swagger UI)
- **Customer Web Application**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard Console**: [http://localhost:3001](http://localhost:3001)

---

## 5. Verification Commands

Run workspace-wide tasks to ensure there are no compilation errors:

- **Lint checks**: `pnpm run lint`
- **Strict type checking**: `pnpm run type-check`
- **Build assets**: `pnpm run build`
