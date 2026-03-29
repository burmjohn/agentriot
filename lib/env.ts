import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { parseAdminEmailAllowlist } from "@/lib/auth/admin-policy";

const defaultDatabaseUrl =
  "postgres://postgres:postgres@localhost:5432/agentriot";
const defaultAppUrl = "http://localhost:3011";
const defaultAuthSecret = "development-only-secret-change-me-now-1234";
const defaultApiKeyEncryptionKey = "12345678901234567890123456789012";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1).default(defaultDatabaseUrl),
    BETTER_AUTH_SECRET: z.string().min(32).default(defaultAuthSecret),
    BETTER_AUTH_URL: z.string().url().default(defaultAppUrl),
    API_KEY_ENCRYPTION_KEY: z.string().length(32).default(defaultApiKeyEncryptionKey),
    ADMIN_EMAIL_ALLOWLIST: z.string().default(""),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().default(defaultAppUrl),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    API_KEY_ENCRYPTION_KEY: process.env.API_KEY_ENCRYPTION_KEY,
    ADMIN_EMAIL_ALLOWLIST: process.env.ADMIN_EMAIL_ALLOWLIST,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  emptyStringAsUndefined: true,
});

export const adminEmailAllowlist = parseAdminEmailAllowlist(
  env.ADMIN_EMAIL_ALLOWLIST,
);
