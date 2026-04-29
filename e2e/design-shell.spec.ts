import { test, expect } from "@playwright/test";

async function getGradientOffenders(page: import("@playwright/test").Page) {
  return page.locator("*").evaluateAll((els) =>
    els
      .flatMap((el) => {
        const style = window.getComputedStyle(el);
        if (
          style.backgroundImage !== "none" &&
          style.backgroundImage.includes("gradient")
        ) {
          return [
            {
              tag: el.tagName.toLowerCase(),
              className: el.className,
              backgroundImage: style.backgroundImage,
            },
          ];
        }

        return [];
      })
      .slice(0, 10)
  );
}

function isIntentionalHomepageGradient(
  gradient: Awaited<ReturnType<typeof getGradientOffenders>>[number]
) {
  const className = String(gradient.className);
  const backgroundImage = gradient.backgroundImage;

  return (
    className.includes("bg-gradient-to-br") &&
    ((className.includes("from-[var(--riot-page)]") &&
      className.includes("to-white") &&
      backgroundImage.includes("linear-gradient")) ||
      (className.includes("from-[var(--riot-blue)]/10") &&
        className.includes("to-[var(--riot-orange)]/10") &&
        backgroundImage.includes("linear-gradient")))
  );
}

function isLegacyGradient(
  gradient: Awaited<ReturnType<typeof getGradientOffenders>>[number]
) {
  const legacyNeedles = [
    "rgb(19, 19, 19)",
    "rgb(60, 255, 208)",
    "rgb(82, 0, 255)",
    "#131313",
    "#3cffd0",
    "#5200ff",
    "mint",
    "ultraviolet",
  ];
  const haystack = `${gradient.className} ${gradient.backgroundImage}`.toLowerCase();
  return legacyNeedles.some((needle) => haystack.includes(needle.toLowerCase()));
}

async function getCanvasBackgrounds(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const selectors = ["html", "body", "body > div", "main"];
    return selectors
      .map((selector) => {
        const element = document.querySelector(selector);
        return element ? window.getComputedStyle(element).backgroundColor : null;
      })
      .filter((value): value is string => Boolean(value));
  });
}

test.describe("Design System Shell — Task 2", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("light canvas — redesigned homepage", async ({ page }) => {
    const backgrounds = await getCanvasBackgrounds(page);
    expect(backgrounds).toContain("rgb(255, 255, 255)");
  });

  test("allows intentional light homepage gradients and rejects legacy gradients", async ({ page }) => {
    const gradients = await getGradientOffenders(page);
    expect(gradients).toHaveLength(2);
    expect(gradients.every(isIntentionalHomepageGradient)).toBe(true);
    expect(gradients.filter(isLegacyGradient)).toEqual([]);
  });

  test("navigation shell renders with wordmark", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator('header img[alt="AgentRiot"]')).toBeVisible();
  });

  test("CTA links render", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Get Started" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Read the Protocol" })).toBeVisible();
  });

  test("category tags render", async ({ page }) => {
    await expect(page.getByText("Major Release", { exact: true })).toBeVisible();
  });

  test("homepage hero renders", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "THE PUBLIC DISCOVERY PLATFORM FOR INTELLIGENT SYSTEMS" })
    ).toBeVisible();
    await expect(
      page.getByText("THE PUBLIC DISCOVERY PLATFORM", { exact: true })
    ).toBeVisible();
  });

  test("homepage section headings render", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "THE PLATFORM PILLARS" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Live Agent Activity" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Join the Riot" })).toBeVisible();
  });
});
