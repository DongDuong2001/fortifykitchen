# Contributing Guidelines

Welcome! We are excited to collaborate with you on **FortifyKitchen**.

To maintain codebase health, code consistency, and a smooth CI/CD flow, please follow these guidelines.

---

## 1. Local Setup

Make sure you have Node.js v24+ and pnpm v9+ installed.

1. Clone the repository.
2. Run `pnpm install` in the root.
3. Set up the local `.env` variables (see [setup_guide.md](docs/setup_guide.md)).
4. Run `pnpm run db:generate` to generate the Prisma Client.
5. Launch dev servers: `pnpm run dev`.

---

## 2. Branching & Commit Conventions

### Branch Naming Scheme
Use feature prefixes:
- `feat/feature-name` (for new features)
- `fix/bug-name` (for error fixes)
- `docs/doc-updates` (for documentation)
- `chore/tool-name` (for tooling/dependency updates)

### Conventional Commits
All commits must follow the Conventional Commits specification:
```text
<type>(<scope>): <description>

[optional body]
```

**Types allowed**:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation updates
- `style`: Whitespace, formatting
- `refactor`: Restructuring code with no functional change
- `test`: Adding/editing tests
- `chore`: Tooling, build pipeline, dependencies

**Examples**:
- `feat(ui): add Dialog component to packages/ui`
- `fix(api): fix current user parameter typing check`
- `chore(repo): update dependencies`

---

## 3. Code Validation Rules

Before pushing code or opening a Pull Request, verify that all checks pass successfully:

```bash
# 1. Format code
pnpm run format

# 2. Check for syntax/strict compiler errors
pnpm run type-check

# 3. Lint the workspace
pnpm run lint

# 4. Verify builds compile cleanly
pnpm run build
```

---

## 4. Pull Request Process

1. Create a branch from `main`.
2. Implement and test your changes locally.
3. Ensure all validation rules pass.
4. Commit your changes using Conventional Commits.
5. Push to your branch and open a Pull Request.
6. Make sure to complete the PR description checklist.
7. A peer review and a green CI pipeline are required before merging.
