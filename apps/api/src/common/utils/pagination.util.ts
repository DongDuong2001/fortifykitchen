// Parses optional page/limit query params into Prisma skip/take.
//
// When neither is provided, returns undefined skip/take so every existing
// caller keeps today's "return everything" behavior unchanged — this app's
// current scale (single-kitchen trial) doesn't need forced pagination UI
// yet. What it *does* need is a bounded-fetch option available on every
// list endpoint so none of them can return an unbounded number of rows once
// a caller opts in (or once the frontend adds paged views later).
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export interface ParsedPagination {
  skip?: number;
  take?: number;
  page?: number;
  limit?: number;
}

export function parsePagination(page?: string, limit?: string): ParsedPagination {
  if (page === undefined && limit === undefined) {
    return { skip: undefined, take: undefined, page: undefined, limit: undefined };
  }
  const parsedLimit = Math.min(Math.max(parseInt(limit ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const parsedPage = Math.max(parseInt(page ?? "1", 10) || 1, 1);
  return {
    skip: (parsedPage - 1) * parsedLimit,
    take: parsedLimit,
    page: parsedPage,
    limit: parsedLimit,
  };
}
