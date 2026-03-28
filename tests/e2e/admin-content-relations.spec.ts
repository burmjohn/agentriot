import { test } from "@playwright/test";
import { AdminContentPage } from "./pages/admin-content-page";
import { PublicContentPage } from "./pages/public-content-page";
import { SignInPage } from "./pages/sign-in-page";

test("admin can update content taxonomy and skill relations and see the public graph change", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);
  const adminContentPage = new AdminContentPage(page);
  const articlePage = new PublicContentPage(page);

  await articlePage.gotoArticle("what-changed-this-week-in-coding-agents");
  await articlePage.expectTaxonomyTerm("Coding Agents");
  await articlePage.expectMissingRelatedSkill("News Harvesting");
  await articlePage.expectHeroImage("What Changed This Week in Coding Agents");

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();
  await adminContentPage.gotoList();
  await adminContentPage.openRecord("What Changed This Week in Coding Agents");
  await adminContentPage.expectHeroImagePreview();

  await adminContentPage.saveTaxonomy("Workflow Packs");
  await adminContentPage.expectSuccessBanner("Taxonomy updated.");
  await adminContentPage.expectTaxonomyChecked("Workflow Packs");

  await adminContentPage.saveRelatedSkill("News Harvesting");
  await adminContentPage.expectSuccessBanner("Related skills updated.");
  await adminContentPage.expectRelatedSkillChecked("News Harvesting");

  await articlePage.gotoArticle("what-changed-this-week-in-coding-agents");
  await articlePage.expectTaxonomyTerm("Workflow Packs");
  await articlePage.expectRelatedSkill("News Harvesting");
  await articlePage.expectHeroImage("What Changed This Week in Coding Agents");
});
