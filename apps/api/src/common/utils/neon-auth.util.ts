import * as jose from "jose";

interface JwtPayload {
  [key: string]: unknown;
  exp?: number;
  sub?: string;
  email?: string;
  role?: string;
}

export class JwtVerificationError extends Error {}

let jwksCache: ReturnType<typeof jose.createRemoteJWKSet> | null = null;
let jwksUrl: string | null = null;

/**
 * Get or create the JWKS client for Neon Auth
 */
export function getNeonAuthJWKS(jwksUrlParam: string): ReturnType<typeof jose.createRemoteJWKSet> {
  if (jwksCache && jwksUrl === jwksUrlParam) {
    return jwksCache;
  }

  jwksUrl = jwksUrlParam;
  jwksCache = jose.createRemoteJWKSet(new URL(jwksUrlParam), {
    cacheMaxAge: 60 * 60 * 1000, // 1 hour cache
    cooldownDuration: 60 * 1000, // 1 minute cooldown on error
  });

  return jwksCache;
}

/**
 * Verify a JWT using Neon Auth's JWKS
 */
export async function verifyNeonAuthToken(
  token: string,
  jwksUrl: string,
  audience?: string,
): Promise<JwtPayload> {
  const jwks = getNeonAuthJWKS(jwksUrl);
  const { payload } = await jose.jwtVerify(token, jwks, {
    audience,
    issuer: new URL(jwksUrl).origin + "/neondb/auth",
  });
  return payload as JwtPayload;
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}