import { mkdirSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const EVIDENCE_DIR = path.join(process.cwd(), ".sisyphus", "evidence");

const PUBLIC_ROUTES = [
  { route: "/", slug: "home" },
  { route: "/feed", slug: "feed" },
  { route: "/news", slug: "news" },
  { route: "/news/openclaw-ships-control-plane", slug: "news-openclaw-ships-control-plane" },
  { route: "/software", slug: "software" },
  { route: "/software/openclaw", slug: "software-openclaw" },
  { route: "/agents", slug: "agents" },
  { route: "/agents/atlas-research-agent", slug: "agents-atlas-research-agent" },
  {
    route: "/agents/atlas-research-agent/updates/major-release-openclaw-control-plane",
    slug: "agents-atlas-research-agent-updates-major-release-openclaw-control-plane",
  },
  { route: "/about", slug: "about" },
  { route: "/join", slug: "join" },
  { route: "/join/claim", slug: "join-claim" },
  { route: "/agent-instructions", slug: "agent-instructions" },
  { route: "/docs/install", slug: "docs-install" },
  { route: "/docs/post-updates", slug: "docs-post-updates" },
  { route: "/docs/claim-agent", slug: "docs-claim-agent" },
] as const;

function ensureEvidenceDir() {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
}

function getWidth(page: Page) {
  return page.viewportSize()?.width ?? 0;
}

async function expectDarkCanvas(page: Page) {
  const backgrounds = await page.evaluate(() => {
    const selectors = ["html", "body", "body > div", "main"];
    return selectors
      .map((selector) => {
        const element = document.querySelector(selector);
        return element ? window.getComputedStyle(element).backgroundColor : null;
      })
      .filter((value): value is string => Boolean(value));
  });

  expect(backgrounds).toContain("rgb(19, 19, 19)");
}

async function getGradientOffenders(page: Page) {
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
      .slice(0, 20)
  );
}

async function getSoftShadowOffenders(page: Page) {
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
      .slice(0, 20)
  );
}

async function expectNoGradients(page: Page) {
  expect(await getGradientOffenders(page)).toEqual([]);
}

async function expectNoSoftShadows(page: Page) {
  expect(await getSoftShadowOffenders(page)).toEqual([]);
}

test.describe("Public design compliance — Task 8", () => {
  test("captures every public route across the viewport matrix", async ({ page }) => {
    ensureEvidenceDir();
    const width = getWidth(page);

    for (const item of PUBLIC_ROUTES) {
      await test.step(`check ${item.route}`, async () => {
        await page.goto(item.route, { waitUntil: "networkidle" });
        await expectDarkCanvas(page);
        await expectNoGradients(page);
        await expectNoSoftShadows(page);

        if (item.route.startsWith("/docs/")) {
          await expect(page.locator("footer")).toBeVisible();
        }

        await page.screenshot({
          path: path.join(EVIDENCE_DIR, `task-8-${item.slug}-${width}.png`),
          fullPage: true,
        });
      });
    }
  });

  test("mobile nav drawer opens and exposes links", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile nav is only checked on the mobile viewport project.");

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByTestId("mobile-nav-toggle")).toBeVisible();
    await page.getByTestId("mobile-nav-toggle").click();

    const drawer = page.getByTestId("mobile-nav-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: "NEWS" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "SOFTWARE" })).toBeVisible();
    await expect(page.getByTestId("mobile-nav-close")).toBeVisible();
  });
});
