import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

const globalForDatabase = globalThis as typeof globalThis & {
  agentriotSql?: ReturnType<typeof postgres>;
};

const client =
  globalForDatabase.agentriotSql ??
  postgres(env.DATABASE_URL, {
    prepare: false,
  });

if (env.NODE_ENV !== "production") {
  globalForDatabase.agentriotSql = client;
}

export const dbClient = client;

export const db = drizzle({
  client,
  schema,
});
