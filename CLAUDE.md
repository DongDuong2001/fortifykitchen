# Working notes for Claude / agents in this repo

Operational lessons from past feature work, kept here so they carry forward
into future sessions without re-learning them the hard way.

## Workflow (PUDO)

Plan → Understand → Develop → Optimize. For any non-trivial change:
1. Plan the schema/API/UI shape before touching files.
2. Understand the current code (read before editing — this repo has large,
   single-file `page.tsx` client components in `apps/admin-dashboard` and
   `apps/customer-web`, both several thousand lines).
3. Develop incrementally.
4. Optimize/verify before calling it done (typecheck, grep for stale
   references, review diffs).

## Git discipline

- Never commit directly to `main` or `ui-testing` — use a dedicated
  `feature/*` branch.
- Commit after each *completed, working* feature — do not batch multiple
  features into one commit. Small, scoped, Conventional Commit messages
  (`feat(api): ...`, `fix(admin-dashboard): ...`, `chore(db): ...`).
- Stage deliberately (`git add <specific files>`), not `git add -A`.

## Database

- This repo uses **`prisma db push`**, not `prisma migrate` — there is no
  `packages/database/prisma/migrations` folder. After any schema change:
  ```
  pnpm db:push && pnpm db:generate
  ```
  then restart the API dev server so it picks up the regenerated Prisma
  client types.
- `db push` will warn about data loss (dropped columns/tables) before
  applying anything — it's a real interactive confirmation prompt, not a
  log line. If scripted/non-interactive, use `--accept-data-loss` only once
  the data being dropped is confirmed to be disposable (dev/seed data).

## Renaming or deleting a module/entity (e.g. the Order/Delivery unification)

When a refactor removes a Prisma model or a whole NestJS module:
1. Update `packages/database/prisma/schema.prisma` first.
2. Update `packages/types/src/index.ts` (hand-written types consumed by
   both frontend apps) and `packages/shared/src/*` (labels/constants) —
   these resolve to **pre-built `dist/`** output for workspace consumers,
   so after editing `src/`, rebuild with `npx tsc` inside that package
   (`packages/types`, `packages/shared`) or downstream typechecks will use
   stale types.
3. Rewrite the API module (service/controller/dto), then remove the old
   module directory and its registration in `app.module.ts`.
4. Grep both `apps/admin-dashboard/src/app/page.tsx` and
   `apps/customer-web/src/app/page.tsx` for the old field/endpoint names.
   **These files use pervasive `React.useState<any>` typing**, so
   `tsc --noEmit` will NOT catch stale property names or dead endpoint
   URLs in them — manual grep + review is required, not just a clean
   typecheck.
5. After deleting an old module directory, physically remove it
   (`rm -rf apps/api/src/modules/<old-module>`) — don't just `git rm` it.
   (An agent working in a sandboxed/mounted-folder environment may only be
   able to untrack it via `git rm --cached`, leaving the physical files on
   disk; if so, delete the leftover folder yourself before running `dev` —
   stray `.ts` files left in `src/` get picked up by the TS watch compiler
   even though they're no longer imported anywhere, producing confusing
   "module has no exported member" errors that look like real bugs but
   aren't.)

## Verifying without a live DB/network (agent sandbox constraint)

In a sandboxed agent environment without network access to Prisma's engine
binaries or a local Postgres instance, `prisma generate` / `db push` /
`migrate` cannot run at all. That means:
- `apps/api` and `packages/database` **cannot** be typechecked in that
  environment (they need the generated `@prisma/client` types).
- `packages/types`, `packages/shared`, `apps/admin-dashboard`, and
  `apps/customer-web` **can** be typechecked (`npx tsc --noEmit` in each
  package/app dir) since none of them depend on the generated Prisma
  client directly.
- Always call this limitation out explicitly when handing work back, and
  list the exact commands the human needs to run on a machine with real
  DB/network access before testing (`pnpm db:push && pnpm db:generate`,
  restart dev servers).

## Design

Visual/UI work should stay in sync with the root `DESIGN.md` (colors,
typography, spacing, component conventions). When only partial UI surface
area can be redesigned in a session, say so explicitly rather than
implying full coverage.

## Git lock files on this sandbox's mounted folder

When working from an agent sandbox with the repo mounted from the host
filesystem, `git add`/`git commit` can leave a stale `.git/index.lock` (or
`.git/HEAD.lock`, or `.git/objects/**/tmp_obj_*`) that a plain `rm -f`
cannot remove (`Operation not permitted` — the mount allows `rename()` but
not `unlink()` on files git itself just created). `mv` works where `rm`
doesn't. Before every git command that writes to the index/refs, run:
```
[ -f .git/index.lock ] && mv .git/index.lock ".git/index.lock.stale.$$" 2>/dev/null
[ -f .git/HEAD.lock ] && mv .git/HEAD.lock ".git/HEAD.lock.stale.$$" 2>/dev/null
```
then proceed with the actual `git add`/`git commit`. Ignore any "warning:
unable to unlink ... Operation not permitted" noise printed during the
command itself — it's non-fatal as long as the command's final result
(the commit hash, `git status` afterward) confirms it worked. This isn't
specific to any one file — it can recur on any commit. The same
`rm`-fails-`mv`-works quirk also applies to arbitrary tracked/untracked
files (a stray old module directory can't be physically deleted with
`rm -rf` either — see "Renaming or deleting a module/entity" above, which
already documents the `git rm --cached` fallback for that case).
