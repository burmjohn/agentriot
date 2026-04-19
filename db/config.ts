const DEFAULT_HOST = "192.168.0.25";
const DEFAULT_PORT = 5432;
const DEFAULT_USER = "agentriot";
const DEFAULT_PASSWORD = "agentriot";

export const DATABASE_NAMES = {
  development: "agentriot_dev",
  test: "agentriot_test",
} as const;

type DatabaseName =
  (typeof DATABASE_NAMES)[keyof typeof DATABASE_NAMES] | string;

export function getRuntimeDatabaseName() {
  if (process.env.NODE_ENV === "test") {
    return process.env.AGENTRIOT_TEST_DB_NAME ?? DATABASE_NAMES.test;
  }

  return process.env.AGENTRIOT_DB_NAME ?? DATABASE_NAMES.development;
}

export function getDrizzleDatabaseName() {
  return process.env.DRIZZLE_DB_NAME ?? DATABASE_NAMES.development;
}

export function getDatabaseConfig(databaseName: DatabaseName) {
  return {
    host: process.env.PGHOST ?? DEFAULT_HOST,
    port: Number(process.env.PGPORT ?? DEFAULT_PORT),
    user: process.env.PGUSER ?? DEFAULT_USER,
    password: process.env.PGPASSWORD ?? DEFAULT_PASSWORD,
    database: databaseName,
    ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
  };
}

export function buildDatabaseUrl(databaseName: DatabaseName) {
  const config = getDatabaseConfig(databaseName);
  const credentials = `${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}`;
  const params = config.ssl ? "?sslmode=require" : "";

  return `postgresql://${credentials}@${config.host}:${config.port}/${config.database}${params}`;
}
