import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// The app runs against Neon (a serverless/pooled Postgres — note the
// "-pooler" host and the PgBouncer transaction pooler behind it). Neon's
// free-tier compute auto-suspends after a few minutes of inactivity; the
// pool's existing sockets go stale while it's suspended, and the very next
// query after a wake-up (or any other transient network blip to the
// pooler) fails with `Error { kind: Closed, cause: None }` even though a
// brand-new connection would succeed immediately. Retrying once, on a
// fresh connection, is safe for reads and for the writes we do here
// (no query has already partially applied when the socket was already
// closed before it was sent) and makes the blip invisible to callers
// instead of surfacing as a 500.
function isTransientConnectionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("kind: Closed") ||
    message.includes("Connection terminated") ||
    message.includes("Server has closed the connection") ||
    message.includes("ECONNRESET") ||
    message.includes("P1001") ||
    message.includes("P1017")
  );
}

function createPrismaClient(): PrismaClient {
  const base = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  return base.$extends({
    query: {
      async $allOperations({ args, query }) {
        try {
          return await query(args);
        } catch (err) {
          if (!isTransientConnectionError(err)) {
            throw err;
          }
          return await query(args);
        }
      },
    },
  }) as unknown as PrismaClient;
}

// Lazily constructed behind a Proxy. Previously this ran `new PrismaClient()`
// at *import* time, which means merely importing a type or enum from this
// package (as almost every service does, just to reference e.g.
// OrderFulfillmentType) tried to load the native query engine binary for
// the current platform. That's harmless in the running app (NestJS calls
// $connect() in onModuleInit right after boot anyway) but it made this
// package impossible to import in unit tests on a machine/CI runner whose
// prebuilt engine doesn't match — construction is now deferred until the
// first real property access (e.g. `this.client.$connect()` or
// `this.client.menuItem.findMany(...)`).
let _client: PrismaClient | undefined;
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, _receiver) {
    if (!_client) {
      _client = globalThis.prisma || createPrismaClient();
      if (process.env.NODE_ENV !== "production") {
        globalThis.prisma = _client;
      }
    }
    const value = Reflect.get(_client as object, prop, _client);
    // Bind functions explicitly to the real client — a bare Reflect.get
    // through a Proxy does NOT preserve `this` on a later call like
    // `proxy.$transaction(cb)` (the call site sets `this` to the proxy,
    // not the underlying client), and Prisma's methods rely on internal
    // `this` state.
    return typeof value === "function" ? value.bind(_client) : value;
  },
});

export * from "@prisma/client";
export { Decimal };
export type PrismaClientType = PrismaClient;
export type DecimalType = Decimal;
