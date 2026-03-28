import { expect, test } from "@playwright/test";
import { AdminSkillPage } from "./pages/admin-skill-page";
import { PublicSkillPage } from "./pages/public-skill-page";
import { SignInPage } from "./pages/sign-in-page";

test("editing a published skill title preserves the old public path via redirect", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);
  const adminSkillPage = new AdminSkillPage(page);
  const publicSkillPage = new PublicSkillPage(page);
  const originalSlug = "news-harvesting";
  const updatedSlug = "news-harvesting-system";
  const updatedTitle = "News Harvesting System";

  await publicSkillPage.goto(originalSlug);
  await publicSkillPage.expectHeading("News Harvesting");

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();
  await adminSkillPage.gotoList();
  await adminSkillPage.openRecord("News Harvesting");
  await adminSkillPage.updateTitle(updatedTitle);
  await adminSkillPage.expectSlugValue(updatedSlug);
  await adminSkillPage.saveSkill();
  await adminSkillPage.expectSuccessBanner("Skill saved.");

  await page.goto(`/skills/${originalSlug}`);
  await expect(page).toHaveURL(new RegExp(`/skills/${updatedSlug}$`));
  await publicSkillPage.expectHeading(updatedTitle);

  await adminSkillPage.gotoList();
  await adminSkillPage.openRecord(updatedTitle);
  await adminSkillPage.updateTitle("News Harvesting");
  await adminSkillPage.expectSlugValue(originalSlug);
  await adminSkillPage.saveSkill();
  await adminSkillPage.expectSuccessBanner("Skill saved.");
});
