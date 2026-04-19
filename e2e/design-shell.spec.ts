import { test, expect } from "@playwright/test";

test.describe("Design System Shell — Task 2", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("dark canvas — no light mode", async ({ page }) => {
    const body = page.locator("body");
    const bg = await body.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(bg).toBe("rgb(19, 19, 19)");
  });

  test("no gradients on page", async ({ page }) => {
    const gradients = await page.locator("*").evaluateAll((els) =>
      els.filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          style.backgroundImage.includes("gradient") &&
          style.backgroundImage !== "none"
        );
      })
    );
    expect(gradients.length).toBe(0);
  });

  test("no soft shadows (box-shadow blur > 2px)", async ({ page }) => {
    const softShadows = await page.locator("*").evaluateAll((els) =>
      els.filter((el) => {
        const shadow = window.getComputedStyle(el).boxShadow;
        if (shadow === "none") return false;
        const blurMatch = shadow.match(/(\d+px)\s+\d+px\s+(\d+px)/);
        if (!blurMatch) return false;
        const blur = parseInt(blurMatch[2], 10);
        return blur > 2;
      })
    );
    expect(softShadows.length).toBe(0);
  });

  test("navigation shell renders with wordmark", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("header", { hasText: "AGENTRIOT" })).toBeVisible();
  });

  test("pill buttons render", async ({ page }) => {
    await expect(page.locator("button", { hasText: "Primary Pill" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Secondary Pill" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Tertiary Pill" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Ultraviolet Pill" })).toBeVisible();
  });

  test("pill tags render", async ({ page }) => {
    await expect(page.locator("span", { hasText: "MINT" })).toBeVisible();
    await expect(page.locator("span", { hasText: "ULTRAVIOLET" })).toBeVisible();
  });

  test("StoryStream timeline renders", async ({ page }) => {
    await expect(page.locator("text=StoryStream Timeline")).toBeVisible();
    await expect(page.locator("text=10:42 AM")).toBeVisible();
    await expect(page.locator("text=09:15 AM")).toBeVisible();
  });

  test("typography scale renders", async ({ page }) => {
    await expect(page.locator("text=Typography Scale")).toBeVisible();
    await expect(page.locator("text=Display MD")).toBeVisible();
  });
});
