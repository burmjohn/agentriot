import { defineConfig } from "drizzle-kit";

import { getDatabaseConfig, getDrizzleDatabaseName } from "./db/config";

const database = getDatabaseConfig(getDrizzleDatabaseName());

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/**/*.ts",
  out: "./db/migrations",
  dbCredentials: {
    host: database.host,
    port: database.port,
    user: database.user,
    password: database.password,
    database: database.database,
    ssl: database.ssl || undefined,
  },
  strict: true,
  verbose: true,
});
