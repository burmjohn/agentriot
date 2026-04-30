import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

import { getDatabaseConfig, getRuntimeDatabaseName } from "./config";

const pools = new Map<string, Pool>();
const clients = new Map<string, ReturnType<typeof drizzle>>();

function getPoolLimit() {
  const limit = Number(process.env.AGENTRIOT_PG_POOL_MAX ?? 3);
  return Number.isFinite(limit) && limit > 0 ? limit : 3;
}

export function createPool(databaseName = getRuntimeDatabaseName()) {
  const existing = pools.get(databaseName);
  if (existing) {
    return existing;
  }

  const config: PoolConfig = {
    ...getDatabaseConfig(databaseName),
    max: getPoolLimit(),
    idleTimeoutMillis: 10_000,
  };
  const pool = new Pool(config);
  pools.set(databaseName, pool);

  return pool;
}

export function createDb(databaseName = getRuntimeDatabaseName()) {
  const existing = clients.get(databaseName);
  if (existing) {
    return existing;
  }

  const client = drizzle(createPool(databaseName));
  clients.set(databaseName, client);

  return client;
}
