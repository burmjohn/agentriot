import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const PUBLIC_PAGE_MATRIX = [
  "/",
  "/feed",
  "/news",
  "/news/openclaw-ships-control-plane",
  "/software",
  "/software/openclaw",
  "/agents",
  "/agents/atlas-research-agent",
  "/agents/atlas-research-agent/updates/major-release-openclaw-control-plane",
  "/prompts",
  "/prompts/release-risk-brief",
  "/about",
  "/join",
  "/join/claim",
  "/agent-instructions",
  "/docs/api-reference",
  "/docs/install",
  "/docs/post-updates",
  "/docs/claim-agent",
  "/docs/build-publish-skill",
] as const;

const LINK_CRAWL_SOURCES = [
  "/",
  "/news",
  "/software",
  "/agents",
  "/prompts",
  "/agent-instructions",
  "/docs/install",
  "/docs/api-reference",
] as const;

const PUBLIC_API_MATRIX = [
  "/api/agent-protocol",
  "/api/openapi",
  "/api/software?query=openclaw",
  "/api/agents/atlas-research-agent",
] as const;

const SKIPPED_INTERNAL_PATHS = [
  /^\/api\/feed\/stream$/,
  /^\/admin(?:\/|$)/,
  /^\/api\/admin(?:\/|$)/,
] as const;

function shouldSkipInternalPath(pathname: string) {
  return SKIPPED_INTERNAL_PATHS.some((pattern) => pattern.test(pathname));
}

async function expectRouteOk(page: Page, route: string) {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response, `${route} should return a response`).not.toBeNull();
  expect(response?.status(), `${route} should not 404/500`).toBeLessThan(400);
}

async function expectRequestOk(request: APIRequestContext, route: string) {
  const response = await request.get(route);
  expect(response.status(), `${route} should not 404/500`).toBeLessThan(400);
}

async function collectInternalLinks(page: Page, route: string) {
  await expectRouteOk(page, route);
  return page.locator("a[href]").evaluateAll((links) =>
    links.flatMap((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return [];

      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return [];

      return [`${url.pathname}${url.search}`];
    }),
  );
}

test.describe("public route and link integrity", () => {
  test("route matrix resolves public pages without 404s", async ({ page }) => {
    for (const route of PUBLIC_PAGE_MATRIX) {
      await expectRouteOk(page, route);
    }
  });

  test("homepage prompt navigation uses public prompt routes", async ({ page }) => {
    await expectRouteOk(page, "/");

    const promptLinks = page.locator('a[href^="/prompts/"]');
    await expect(promptLinks.first()).toBeVisible();
    await expect(page.locator('a[href^="/agent-instructions/"]')).toHaveCount(0);
    await expect(page.locator('a[href="/prompts"]', { hasText: /browse all prompts/i })).toBeVisible();
    await expect(page.locator('a[href="/prompts"]', { hasText: /explore prompts|explore all/i }).first()).toBeVisible();
  });

  test("visible internal links from reviewed surfaces resolve", async ({ page, request }) => {
    const discovered = new Set<string>();

    for (const source of LINK_CRAWL_SOURCES) {
      for (const link of await collectInternalLinks(page, source)) {
        const pathname = new URL(link, "http://localhost").pathname;
        if (!shouldSkipInternalPath(pathname)) {
          discovered.add(link);
        }
      }
    }

    expect(discovered.size, "route matrix should discover internal links").toBeGreaterThan(0);

    for (const route of [...discovered].sort()) {
      if (route.startsWith("/api/")) {
        await expectRequestOk(request, route);
      } else {
        await expectRouteOk(page, route);
      }
    }
  });

  test("public APIs and safe auth boundaries remain coherent", async ({ request }) => {
    for (const route of PUBLIC_API_MATRIX) {
      await expectRequestOk(request, route);
    }

    const unauthorizedAdminMutation = await request.post(
      "/api/admin/agents/atlas-research-agent/ban",
    );
    expect(unauthorizedAdminMutation.status()).toBe(401);

    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("Disallow: /api/admin");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const sitemapXml = await sitemap.text();
    expect(sitemapXml).toContain("/prompts/release-risk-brief");
    expect(sitemapXml).not.toContain("/agent-instructions/research-assistant");
  });
});
