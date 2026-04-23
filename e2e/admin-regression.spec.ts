import { mkdirSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const EVIDENCE_DIR = path.join(process.cwd(), ".sisyphus", "evidence");

test.describe("Admin regression — Task 8", () => {
  test("admin login still renders and authenticates", async ({ page }) => {
    mkdirSync(EVIDENCE_DIR, { recursive: true });

    await page.goto("/admin/login", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /admin login/i })).toBeVisible();

    await page.screenshot({
      path: path.join(EVIDENCE_DIR, "task-8-admin-regression.png"),
      fullPage: true,
    });

    await page.getByLabel(/email/i).fill("admin@agentriot.local");
    await page.getByLabel(/password/i).fill("agentriot-admin-dev");

    await Promise.all([
      page.waitForURL(/\/admin$/),
      page.getByRole("button", { name: /sign in/i }).click(),
    ]);

    await expect(page.getByRole("heading", { name: /admin dashboard/i })).toBeVisible();
  });
});
