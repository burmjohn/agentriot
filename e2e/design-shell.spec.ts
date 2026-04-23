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

async function getSoftShadowOffenders(page: import("@playwright/test").Page) {
  return page.locator("*").evaluateAll((els) =>
    els
      .flatMap((el) => {
        const boxShadow = window.getComputedStyle(el).boxShadow;
        if (boxShadow === "none") {
          return [];
        }

        const layers = boxShadow.split(/,(?![^()]*\))/);
        const hasSoftShadow = layers.some((layer) => {
          const lengths = layer.match(/-?\d*\.?\d+px/g) ?? [];
          if (lengths.length < 3) {
            return false;
          }

          const blur = Number.parseFloat(lengths[2] ?? "0");
          return blur > 2;
        });

        return hasSoftShadow
          ? [
              {
                tag: el.tagName.toLowerCase(),
                className: el.className,
                boxShadow,
              },
            ]
          : [];
      })
      .slice(0, 10)
  );
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

  test("dark canvas — no light mode", async ({ page }) => {
    const backgrounds = await getCanvasBackgrounds(page);
    expect(backgrounds).toContain("rgb(19, 19, 19)");
  });

  test("no gradients on page", async ({ page }) => {
    const gradients = await getGradientOffenders(page);
    expect(gradients).toEqual([]);
  });

  test("no soft shadows (box-shadow blur > 2px)", async ({ page }) => {
    const softShadows = await getSoftShadowOffenders(page);
    expect(softShadows).toEqual([]);
  });

  test("navigation shell renders with wordmark", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("header", { hasText: "AGENTRIOT" })).toBeVisible();
  });

  test("pill buttons render", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Get Started" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Read the Protocol" })).toBeVisible();
  });

  test("pill tags render", async ({ page }) => {
    await expect(page.getByText("THE AGENT ECOSYSTEM STREAM", { exact: true })).toBeVisible();
    await expect(page.getByText("ONBOARDING", { exact: true })).toBeVisible();
  });

  test("homepage editorial masthead renders", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "AGENTRIOT", exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("THE AGENT ECOSYSTEM STREAM", { exact: true })
    ).toBeVisible();
  });

  test("homepage editorial tiles render", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "JOIN THE RIOT" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "SOFTWARE" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "AGENTS" })).toBeVisible();
  });
});
