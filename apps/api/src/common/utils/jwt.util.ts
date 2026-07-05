import * as crypto from "crypto";

// Minimal HMAC-SHA256 JWT sign/verify using only Node's built-in `crypto` —
// no external dependency needed (no `jsonwebtoken`/`@nestjs/jwt` installed,
// and this sandbox can't reliably install new packages). This replaces a
// previous implementation that base64-encoded a payload with a *hardcoded*
// "dummy-signature" and never verified anything — meaning anyone could
// forge a token with any user id/role and pass every JwtAuthGuard check.

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64");
}

export interface JwtPayload {
  [key: string]: unknown;
  exp?: number;
}

export function signJwt(payload: JwtPayload, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac("sha256", secret).update(signingInput).digest();
  return `${signingInput}.${base64url(signature)}`;
}

export class JwtVerificationError extends Error {}

export function verifyJwt(token: string, secret: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new JwtVerificationError("Malformed token");
  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto.createHmac("sha256", secret).update(signingInput).digest();
  const actualSignature = base64urlDecode(encodedSignature);

  // Constant-time comparison, and reject if lengths differ (timingSafeEqual
  // throws on mismatched length rather than returning false).
  if (
    expectedSignature.length !== actualSignature.length ||
    !crypto.timingSafeEqual(expectedSignature, actualSignature)
  ) {
    throw new JwtVerificationError("Invalid signature");
  }

  const payload = JSON.parse(base64urlDecode(encodedPayload).toString("utf-8")) as JwtPayload;
  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
    throw new JwtVerificationError("Token expired");
  }
  return payload;
}
