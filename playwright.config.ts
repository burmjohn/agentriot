import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? "3011");
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: /admin-auth\.spec\.ts/,
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
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
