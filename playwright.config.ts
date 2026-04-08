import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? "3013");
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const reuseExistingServer =
  process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === "true";
const webServerEnv = {
  ...process.env,
  PORT: String(port),
  BETTER_AUTH_URL: baseURL,
  NEXT_PUBLIC_APP_URL: baseURL,
};

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: /admin-.*\.spec\.ts/,
  fullyParallel: true,
  reporter: process.env.CI ? [["html"], ["list"]] : "list",
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm db:migrate && pnpm db:seed && pnpm dev",
    env: webServerEnv,
    url: baseURL,
    reuseExistingServer,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
