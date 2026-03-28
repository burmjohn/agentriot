import { expect, test } from "@playwright/test";
import { AdminPromptPage } from "./pages/admin-prompt-page";
import { PublicPromptPage } from "./pages/public-prompt-page";
import { SignInPage } from "./pages/sign-in-page";

test("editing a published prompt title preserves the old public path via redirect", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);
  const adminPromptPage = new AdminPromptPage(page);
  const publicPromptPage = new PublicPromptPage(page);
  const originalSlug = "repository-evaluator";
  const updatedSlug = "repository-evaluator-brief";
  const updatedTitle = "Repository Evaluator Brief";

  await publicPromptPage.goto(originalSlug);
  await publicPromptPage.expectHeading("Repository Evaluator");

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();
  await adminPromptPage.gotoList();
  await adminPromptPage.openRecord("Repository Evaluator");
  await adminPromptPage.updateTitle(updatedTitle);
  await adminPromptPage.expectSlugValue(updatedSlug);
  await adminPromptPage.savePrompt();
  await adminPromptPage.expectSuccessBanner("Prompt saved.");

  await page.goto(`/prompts/${originalSlug}`);
  await expect(page).toHaveURL(new RegExp(`/prompts/${updatedSlug}$`));
  await publicPromptPage.expectHeading(updatedTitle);

  await adminPromptPage.gotoList();
  await adminPromptPage.openRecord(updatedTitle);
  await adminPromptPage.updateTitle("Repository Evaluator");
  await adminPromptPage.expectSlugValue(originalSlug);
  await adminPromptPage.savePrompt();
  await adminPromptPage.expectSuccessBanner("Prompt saved.");
});
