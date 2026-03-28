import { expect, test } from "@playwright/test";
import { AdminPromptPage } from "./pages/admin-prompt-page";
import { PublicPromptPage } from "./pages/public-prompt-page";
import { SignInPage } from "./pages/sign-in-page";

test("admin can update prompt taxonomy and skill relations and expose them publicly", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);
  const adminPromptPage = new AdminPromptPage(page);
  const publicPromptPage = new PublicPromptPage(page);

  await publicPromptPage.goto("repository-evaluator");
  await publicPromptPage.expectTaxonomyTerm("Repo Context");
  await publicPromptPage.expectMissingRelatedSkill("News Harvesting");

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();

  await adminPromptPage.gotoList();
  await adminPromptPage.openRecord("Repository Evaluator");

  await adminPromptPage.saveTaxonomy("Evaluation");
  await adminPromptPage.expectSuccessBanner("Taxonomy updated.");
  await adminPromptPage.expectTaxonomyChecked("Evaluation");

  await adminPromptPage.saveRelatedSkill("News Harvesting");
  await adminPromptPage.expectSuccessBanner("Related skills updated.");
  await adminPromptPage.expectRelatedSkillChecked("News Harvesting");

  await publicPromptPage.goto("repository-evaluator");
  await publicPromptPage.expectTaxonomyTerm("Evaluation");
  await publicPromptPage.expectRelatedSkill("News Harvesting");

  await page.getByRole("link", { name: "Evaluation", exact: true }).click();
  await expect(page).toHaveURL(/\/prompts\?term=evaluation$/);
  await expect(page.getByRole("link", { name: "Repository Evaluator" })).toBeVisible();
});
