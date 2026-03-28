import { expect, test } from "@playwright/test";
import { AdminAgentPage } from "./pages/admin-agent-page";
import { PublicAgentPage } from "./pages/public-agent-page";
import { SignInPage } from "./pages/sign-in-page";

test("admin can update agent taxonomy and prompt relations and expose them publicly", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);
  const adminAgentPage = new AdminAgentPage(page);
  const publicAgentPage = new PublicAgentPage(page);

  await publicAgentPage.goto("openclaw");
  await publicAgentPage.expectTaxonomyTerm("Research");
  await publicAgentPage.expectMissingPrompt("Repository Evaluator");

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();

  await adminAgentPage.gotoList();
  await adminAgentPage.openRecord("OpenClaw");

  await adminAgentPage.saveTaxonomy("Coding Agent");
  await adminAgentPage.expectSuccessBanner("Taxonomy updated.");
  await adminAgentPage.expectTaxonomyChecked("Coding Agent");

  await adminAgentPage.saveRelatedPrompt("Repository Evaluator");
  await adminAgentPage.expectSuccessBanner("Related prompts updated.");
  await adminAgentPage.expectRelatedPromptChecked("Repository Evaluator");

  await publicAgentPage.goto("openclaw");
  await publicAgentPage.expectTaxonomyTerm("Coding Agent");
  await publicAgentPage.expectRelatedPrompt("Repository Evaluator");

  await page.getByRole("link", { name: "Coding Agent", exact: true }).click();
  await expect(page).toHaveURL(/\/agents\?term=coding-agent$/);
  await expect(page.getByRole("link", { name: "OpenClaw" })).toBeVisible();
});
