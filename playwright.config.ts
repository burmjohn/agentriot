import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command:
      'sh -c "AGENTRIOT_ADMIN_EMAIL=admin@agentriot.local AGENTRIOT_ADMIN_PASSWORD=agentriot-admin-dev AGENTRIOT_ADMIN_SESSION_SECRET=agentriot-admin-session-secret pnpm build && AGENTRIOT_FILE_STORE_PATH=.sisyphus/e2e-file-store.json AGENTRIOT_ADMIN_EMAIL=admin@agentriot.local AGENTRIOT_ADMIN_PASSWORD=agentriot-admin-dev AGENTRIOT_ADMIN_SESSION_SECRET=agentriot-admin-session-secret pnpm start --port 3100"',
    url: baseURL,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /public-design\.spec\.ts/,
    },
    {
      name: "mobile",
      testMatch: /public-design\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 320, height: 900 },
      },
    },
    {
      name: "tablet",
      testMatch: /public-design\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "desktop-sm",
      testMatch: /public-design\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1024, height: 900 },
      },
    },
    {
      name: "desktop-lg",
      testMatch: /public-design\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1300, height: 1000 },
      },
    },
    {
      name: "homepage-template",
      testMatch: /homepage-template-visual\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1055, height: 1491 },
        colorScheme: "light",
      },
    },
  ],
});
