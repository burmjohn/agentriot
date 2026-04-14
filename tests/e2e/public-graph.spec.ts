import { expect, test } from "@playwright/test";
import { PublicHubPage } from "./pages/public-hub-page";
import { SignInPage } from "./pages/sign-in-page";

test("homepage links into the published graph", async ({ page }) => {
  const hubPage = new PublicHubPage(page);

  await hubPage.gotoHome();
  await expect(
    page.getByRole("img", {
      name: "What Changed This Week in Coding Agents hero",
    }),
  ).toBeVisible();
  await hubPage.openLeadStory();

  await expect(page).toHaveURL(/\/articles\/what-changed-this-week-in-coding-agents$/);
  await expect(
    page.getByRole("heading", { name: "What Changed This Week in Coding Agents" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "What Changed This Week in Coding Agents hero",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Claude Code" })).toBeVisible();
});

test("search returns mixed published entity types", async ({ page }) => {
  const hubPage = new PublicHubPage(page);

  await hubPage.gotoSearch("repo");
  await expect(page.getByRole("link", { name: "Claude Code" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Repository Evaluator" })).toBeVisible();
  await expect(page.getByRole("link", { name: "News Harvesting" })).toBeVisible();
});

test("search empty states route back into useful public browse surfaces", async ({
  page,
}) => {
  await page.goto("/search?q=this-will-not-match-any-published-record");

  await expect(
    page.getByRole("heading", { name: "No published matches" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Clear search" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse agents" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse prompts" })).toBeVisible();
});

test("sign-in page reflects disabled admin bootstrap state", async ({ page }) => {
  const signInPage = new SignInPage(page);

  await signInPage.goto();
  await signInPage.expectBootstrapDisabled();
});

test("about and api surfaces expose machine-readable entry points", async ({
  page,
}) => {
  await page.goto("/about");
  await expect(
    page.getByRole("heading", { name: "A connected AI intelligence hub, not a flat directory" }),
  ).toBeVisible();

  await page.goto("/api");
  await expect(
    page.getByRole("heading", { name: "Machine-readable access starts with stable public outputs" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "RSS feed" })).toBeVisible();
  await expect(page.getByRole("link", { name: "JSON feed" })).toBeVisible();
  await expect(page.getByRole("link", { name: "robots.txt" })).toBeVisible();
});

test("machine-readable routes return stable public crawl and feed surfaces", async ({
  page,
}) => {
  await page.goto("/api");

  const robots = await page.request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(robots.headers()["content-type"]).toContain("text/plain");
  await expect(page.getByRole("link", { name: "robots.txt" })).toBeVisible();

  const robotsBody = await robots.text();
  expect(robotsBody).toContain("User-Agent: *");
  expect(robotsBody).toContain("Disallow: /admin");
  expect(robotsBody).toContain("/sitemap.xml");

  const llms = await page.request.get("/llms.txt");
  expect(llms.ok()).toBeTruthy();
  expect(llms.headers()["content-type"]).toContain("text/plain");
  expect(await llms.text()).toContain("AgentRiot is the connected discovery surface for agentic coding.");

  const rss = await page.request.get("/feed.xml");
  expect(rss.ok()).toBeTruthy();
  expect(rss.headers()["content-type"]).toContain("application/rss+xml");
  expect(await rss.text()).toContain("<title>AgentRiot feed</title>");

  const jsonFeed = await page.request.get("/feed.json");
  expect(jsonFeed.ok()).toBeTruthy();
  expect(jsonFeed.headers()["content-type"]).toContain("application/json");
  expect(await jsonFeed.json()).toMatchObject({
    title: "AgentRiot feed",
    version: "https://jsonfeed.org/version/1.1",
  });
});

test("articles can be filtered by scoped taxonomy term", async ({ page }) => {
  await page.goto("/articles?term=coding-agents");

  await expect(
    page.getByRole("heading", { name: "Current signal, not feed sludge" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "What Changed This Week in Coding Agents" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Why Most AI Directories Feel Hollow" }),
  ).toHaveCount(0);
});

test("agents can be filtered by scoped taxonomy term", async ({ page }) => {
  await page.goto("/agents?term=research");

  await expect(
    page.getByRole("heading", { name: "Agent records worth tracking" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "OpenClaw" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Claude Code" })).toHaveCount(0);
});

test("empty filtered collections offer a direct recovery path", async ({ page }) => {
  await page.goto("/agents?term=this-filter-does-not-exist");

  await expect(
    page.getByRole("heading", { name: "No published agents match this term yet" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Clear filter" })).toBeVisible();
});

test("homepage trending topic chips route into scoped filtered collections", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Coding Agents", exact: true }).click();

  await expect(page).toHaveURL(/\/articles\?term=coding-agents$/);
  await expect(
    page.getByRole("link", { name: "What Changed This Week in Coding Agents" }),
  ).toBeVisible();
});

test("detail page taxonomy chips route back into scoped collections", async ({
  page,
}) => {
  await page.goto("/articles/what-changed-this-week-in-coding-agents");
  await page.getByRole("link", { name: "Coding Agents", exact: true }).click();

  await expect(page).toHaveURL(/\/articles\?term=coding-agents$/);
  await expect(
    page.getByRole("heading", { name: "Current signal, not feed sludge" }),
  ).toBeVisible();
});

test("prompt detail pages expose related graph navigation", async ({ page }) => {
  await page.goto("/prompts/repository-evaluator");

  await expect(
    page.getByRole("heading", { name: "Repository Evaluator" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Claude Code" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Workflow Composition" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Prompt Packs for Agent MVPs" }),
  ).toBeVisible();

  const workflowLink = page.locator('a[href="/skills/workflow-composition"]');
  await expect(workflowLink).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/skills\/workflow-composition$/),
    workflowLink.click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "Workflow Composition" }),
  ).toBeVisible();
});

test("prompt detail pages support copying the prompt body", async ({ page }) => {
  await page.goto("/prompts/repository-evaluator");

  await expect(
    page.getByRole("button", { name: "Copy prompt" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Copy prompt" }).click();
  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
});

test("tutorials can be filtered by scoped taxonomy term", async ({ page }) => {
  await page.goto("/tutorials?term=workflow-packs");

  await expect(
    page.getByRole("heading", { name: "Practical guides with graph context" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Build an Agent News Pipeline" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Prompt Packs for Agent MVPs" }),
  ).toHaveCount(0);
});

test("prompts can be filtered by scoped taxonomy term", async ({ page }) => {
  await page.goto("/prompts?term=evaluation");

  await expect(
    page.getByRole("heading", { name: "Reusable prompts with actual context" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Agent Failure Postmortem" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Repository Evaluator" }),
  ).toHaveCount(0);
});

test("skills can be filtered by scoped taxonomy term", async ({ page }) => {
  await page.goto("/skills?term=automation");

  await expect(
    page.getByRole("heading", { name: "Skills and workflows with usable context" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Workflow Composition" }),
  ).toBeVisible();
  await expect(page.locator('a[href="/skills/news-harvesting"]')).toHaveCount(0);
});
