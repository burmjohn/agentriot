import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { db } from "@/db";
import { isAdminEmailAllowed } from "@/lib/auth/admin-policy";
import { adminEmailAllowlist, env } from "@/lib/env";

export const auth = betterAuth({
  appName: "AgentRiot",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: adminEmailAllowlist.length === 0,
    autoSignIn: true,
    requireEmailVerification: false,
    minPasswordLength: 12,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const email = ctx.body?.email;

      if (
        typeof email !== "string" ||
        !isAdminEmailAllowed(email, adminEmailAllowlist)
      ) {
        throw new APIError("FORBIDDEN", {
          message: "This email is not authorized for AgentRiot admin access.",
        });
      }
    }),
  },
});

export type Session = typeof auth.$Infer.Session;
