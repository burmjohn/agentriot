import { defineConfig, devices } from "@playwright/test";

const port = 3012;
const baseURL = `http://localhost:${port}`;
const databaseUrl = "postgres://postgres:postgres@localhost:5432/agentriot_admin_e2e";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /admin-.*\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [["html"], ["list"]] : "list",
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: [
      "PGPASSWORD=postgres dropdb --if-exists -h localhost -U postgres agentriot_admin_e2e",
      "PGPASSWORD=postgres createdb -h localhost -U postgres agentriot_admin_e2e",
      `DATABASE_URL=${databaseUrl} pnpm db:migrate`,
      `DATABASE_URL=${databaseUrl} pnpm db:seed`,
      `PORT=${port} DATABASE_URL=${databaseUrl} ADMIN_EMAIL_ALLOWLIST=admin@agentriot.com BETTER_AUTH_URL=${baseURL} NEXT_PUBLIC_APP_URL=${baseURL} pnpm dev`,
    ].join(" && "),
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
