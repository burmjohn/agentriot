import { expect, test } from "@playwright/test";
import { AdminSkillPage } from "./pages/admin-skill-page";
import { PublicSkillPage } from "./pages/public-skill-page";
import { SignInPage } from "./pages/sign-in-page";

test("admin can update skill taxonomy and agent relations and expose them publicly", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);
  const adminSkillPage = new AdminSkillPage(page);
  const publicSkillPage = new PublicSkillPage(page);

  await publicSkillPage.goto("news-harvesting");
  await publicSkillPage.expectTaxonomyTerm("News Harvesting");
  await publicSkillPage.expectMissingRelatedAgent("Paperclip");

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();

  await adminSkillPage.gotoList();
  await adminSkillPage.openRecord("News Harvesting");

  await adminSkillPage.saveTaxonomy("Automation");
  await adminSkillPage.expectSuccessBanner("Taxonomy updated.");
  await adminSkillPage.expectTaxonomyChecked("Automation");

  await adminSkillPage.saveRelatedAgent("Paperclip");
  await adminSkillPage.expectSuccessBanner("Related agents updated.");
  await adminSkillPage.expectRelatedAgentChecked("Paperclip");

  await publicSkillPage.goto("news-harvesting");
  await publicSkillPage.expectTaxonomyTerm("Automation");
  await publicSkillPage.expectRelatedAgent("Paperclip");

  await page.getByRole("link", { name: "Automation", exact: true }).click();
  await expect(page).toHaveURL(/\/skills\?term=automation$/);
  await expect(page.locator('a[href="/skills/news-harvesting"]')).toBeVisible();
});
