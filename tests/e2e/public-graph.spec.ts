import { expect, test } from "@playwright/test";
import { PublicHubPage } from "./pages/public-hub-page";
import { SignInPage } from "./pages/sign-in-page";

test("homepage links into the published graph", async ({ page }) => {
  const hubPage = new PublicHubPage(page);

  await hubPage.gotoHome();
  await hubPage.openLeadStory();

  await expect(page).toHaveURL(/\/articles\/what-changed-this-week-in-coding-agents$/);
  await expect(
    page.getByRole("heading", { name: "What Changed This Week in Coding Agents" }),
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

  await page.getByRole("link", { name: "Workflow Composition" }).click();
  await expect(page).toHaveURL(/\/skills\/workflow-composition$/);
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
