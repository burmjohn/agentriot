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

const FOCUS_TARGETS = [
  { route: "/", label: "home wordmark", selector: 'a[href="/"]' },
  { route: "/", label: "desktop nav link", selector: 'nav a[href="/news"]' },
  { route: "/", label: "search button", selector: 'button[aria-label="Search"]' },
  { route: "/join/claim", label: "claim input", selector: '#agentSlug' },
] as const;

function ensureEvidenceDir() {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
}

function getWidth(page: Page) {
  return page.viewportSize()?.width ?? 0;
}

function isDarkCanvas(color: string): boolean {
  return color === "rgb(19, 19, 19)" || color.toLowerCase() === "#131313";
}

function isLightBackground(color: string): boolean {
  const normalizedColor = color.toLowerCase();
  if (
    normalizedColor === "rgb(255, 255, 255)" ||
    normalizedColor === "rgb(247, 249, 252)" ||
    normalizedColor === "#ffffff" ||
    normalizedColor === "#f7f9fc" ||
    normalizedColor === "var(--riot-white)" ||
    normalizedColor === "var(--riot-page)"
  ) {
    return true;
  }
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return false;
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.85 && a > 0.5;
}

async function sampleCanvasState(page: Page) {
  return page.evaluate(() => {
    const selectors = ["html", "body", "body > div", "main"];
    const backgrounds = selectors
      .map((selector) => {
        const element = document.querySelector(selector);
        return element ? window.getComputedStyle(element).backgroundColor : null;
      })
      .filter((value): value is string => Boolean(value));

    const rootStyle = window.getComputedStyle(document.documentElement);
    const cssCanvasTokens = [
      rootStyle.getPropertyValue("--background").trim(),
      rootStyle.getPropertyValue("--canvas").trim(),
      rootStyle.getPropertyValue("--surface").trim(),
    ].filter(Boolean);

    return { backgrounds, cssCanvasTokens };
  });
}

async function getCanvasState(page: Page) {
  const { backgrounds, cssCanvasTokens } = await sampleCanvasState(page);
  const sampledValues = [...backgrounds, ...cssCanvasTokens];

  return {
    backgrounds,
    cssCanvasTokens,
    hasDark: sampledValues.some(isDarkCanvas),
    hasStrictLight: backgrounds.some(
      (bg) => bg === "rgb(255, 255, 255)" || bg === "rgb(247, 249, 252)"
    ),
    hasLight: sampledValues.some(isLightBackground),
  };
}

async function expectLightCanvas(page: Page, route?: string) {
  await expect
    .poll(
      async () => {
        const state = await getCanvasState(page);
        if (route === "/") return !state.hasDark && state.hasStrictLight;
        return !state.hasDark && state.hasLight;
      },
      {
        message: `wait for stable light canvas on ${route ?? "current route"}`,
        timeout: 5000,
      }
    )
    .toBe(true);
  const canvasState = await getCanvasState(page);

  if (route === "/") {
    expect(canvasState.hasStrictLight).toBe(true);
    expect(canvasState.hasDark).toBe(false);
    return;
  }

  expect(canvasState.hasDark).toBe(false);
  expect(canvasState.hasLight).toBe(true);
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

async function expectVisibleFocusIndicator(page: Page, selector: string) {
  await page.locator(selector).first().focus();
  const focusStyle = await page.locator(selector).first().evaluate((el) => {
    const style = window.getComputedStyle(el);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow,
    };
  });

  expect(
    focusStyle.outlineStyle !== "none" ||
      focusStyle.outlineWidth !== "0px" ||
      focusStyle.boxShadow !== "none"
  ).toBe(true);
}

function transitionDurationToMs(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .map((part) => {
      if (part.endsWith("ms")) return Number.parseFloat(part);
      if (part.endsWith("s")) return Number.parseFloat(part) * 1000;
      return Number.parseFloat(part);
    })[0];
}

test.describe("Public design compliance — Task 8", () => {
  test("captures every public route across the viewport matrix", async ({ page }) => {
    ensureEvidenceDir();
    const width = getWidth(page);
    await page.emulateMedia({ colorScheme: "light" });

    for (const item of PUBLIC_ROUTES) {
      await test.step(`check ${item.route}`, async () => {
        await page.goto(item.route, { waitUntil: "load" });
        await expectLightCanvas(page, item.route);
        if (item.route !== "/") {
          await expectNoGradients(page);
          await expectNoSoftShadows(page);
        }

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

    await page.goto("/", { waitUntil: "load" });
    await expect(page.getByTestId("mobile-nav-toggle")).toBeVisible();
    await page.getByTestId("mobile-nav-toggle").click();

    const drawer = page.getByTestId("mobile-nav-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: "News" })).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Software" })).toBeVisible();
    await expect(page.getByTestId("mobile-nav-close")).toBeVisible();
  });

  test("public routes do not horizontally overflow at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });

    for (const item of PUBLIC_ROUTES) {
      await test.step(`no horizontal overflow: ${item.route}`, async () => {
        await page.goto(item.route, { waitUntil: "load" });
        const overflow = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
        }));

        expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
        expect(overflow.bodyScrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
      });
    }
  });

  test("interactive elements expose visible focus indicators", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });

    for (const target of FOCUS_TARGETS) {
      await test.step(target.label, async () => {
        await page.goto(target.route, { waitUntil: "load" });
        await expectVisibleFocusIndicator(page, target.selector);
      });
    }
  });

  test("desktop keyboard order reaches skip link, nav, search, and CTA logically", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/", { waitUntil: "load" });

    const focusedLabels: string[] = [];
    for (let i = 0; i < 10; i += 1) {
      await page.keyboard.press("Tab");
      focusedLabels.push(
        await page.evaluate(() => {
          const active = document.activeElement;
          return active?.textContent?.trim() || active?.getAttribute("aria-label") || active?.id || "";
        })
      );
    }

    expect(focusedLabels[0]).toBe("Skip to main content");
    expect(focusedLabels).toEqual([
      "Skip to main content",
      "AgentRiot",
      "News",
      "Software",
      "Agents",
      "Feed",
      "Resources",
      "About",
      "Search",
      "Join the Riot",
    ]);
  });

  test("reduced motion preference collapses non-essential transition timing", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/", { waitUntil: "load" });

    const duration = await page.locator('a[href="/news"]').first().evaluate((el) => {
      return window.getComputedStyle(el).transitionDuration;
    });

    expect(transitionDurationToMs(duration)).toBeLessThanOrEqual(0.01);
  });

  test("hover behavior on interactive elements", async ({ page }) => {
    await page.goto("/news", { waitUntil: "load" });

    const headline = page.locator("h2.text-headline-lg").first();
    await expect(headline).toBeVisible();

    const box = await headline.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.waitForTimeout(300);
    const colorAfter = await headline.evaluate(
      (el) => window.getComputedStyle(el).color
    );
    expect(colorAfter).toBe("rgb(20, 87, 245)");

    const firstLink = page.locator("main a").first();
    await expect(firstLink).toBeVisible();
    await firstLink.hover();
    await page.waitForTimeout(200);
    const linkCursor = await firstLink.evaluate(
      (el) => window.getComputedStyle(el).cursor
    );
    expect(linkCursor).toBe("pointer");
  });
});
