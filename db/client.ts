import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getDatabaseConfig, getRuntimeDatabaseName } from "./config";

export function createPool(databaseName = getRuntimeDatabaseName()) {
  return new Pool(getDatabaseConfig(databaseName));
}

export function createDb(databaseName = getRuntimeDatabaseName()) {
  return drizzle(createPool(databaseName));
}
