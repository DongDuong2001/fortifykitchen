import { z } from "zod";

export const backendEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(8),
  BETTER_AUTH_SECRET: z.string().min(8),
  BETTER_AUTH_URL: z.string().url(),
  THROTTLE_TTL: z.coerce.number().default(60),
  THROTTLE_LIMIT: z.coerce.number().default(100),
  // Cron job secret for secure cron endpoint access
  CRON_SECRET: z.string().min(16),
  // Neon Auth - for JWKS-based JWT verification
  NEON_AUTH_JWKS_URL: z.string().url().optional(),
  NEON_AUTH_AUDIENCE: z.string().optional(),
  NEON_AUTH_ISSUER: z.string().url().optional(),
  // Cloudinary - required for image upload
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

export const frontendEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export function validateBackendEnv(env: Record<string, any>) {
  const result = backendEnvSchema.safeParse(env);
  if (!result.success) {
    console.error("❌ Invalid Backend Environment Variables:", result.error.format());
    throw new Error("Invalid backend environment variables");
  }
  return result.data;
}

export function validateFrontendEnv(env: Record<string, any>) {
  const result = frontendEnvSchema.safeParse(env);
  if (!result.success) {
    console.error("❌ Invalid Frontend Environment Variables:", result.error.format());
    throw new Error("Invalid frontend environment variables");
  }
  return result.data;
}

export const APP_CONSTANTS = {
  ORDER: {
    MIN_PREPARATION_MINUTES: 15,
    MAX_ITEMS_PER_ORDER: 50,
  },
  SUBSCRIPTION: {
    TRIAL_DAYS: 7,
    MIN_WEEKS: 4,
  },
};
