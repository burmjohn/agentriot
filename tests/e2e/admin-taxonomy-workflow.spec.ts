import { expect, test } from "@playwright/test";
import { AdminContentPage } from "./pages/admin-content-page";
import { AdminTaxonomyPage } from "./pages/admin-taxonomy-page";
import { PublicContentPage } from "./pages/public-content-page";
import { SignInPage } from "./pages/sign-in-page";

test("admin can create and refine a taxonomy term, attach it to content, and expose it publicly", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);
  const taxonomyPage = new AdminTaxonomyPage(page);
  const contentPage = new AdminContentPage(page);
  const articlePage = new PublicContentPage(page);

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();

  await taxonomyPage.gotoNew();
  await taxonomyPage.createTerm({
    scope: "content",
    kind: "tag",
    label: "Daily Ops",
    slug: "daily-ops",
    description: "Fresh operational signal for the public graph.",
  });
  await taxonomyPage.expectSuccessBanner("Taxonomy term created.");

  await taxonomyPage.openTerm("Daily Ops");
  await taxonomyPage.updateLabel("Daily Ops Loop");
  await taxonomyPage.saveTerm();
  await taxonomyPage.expectSuccessBanner("Taxonomy term saved.");

  await contentPage.gotoList();
  await contentPage.openRecord("What Changed This Week in Coding Agents");
  await contentPage.saveTaxonomy("Daily Ops Loop");
  await contentPage.expectSuccessBanner("Taxonomy updated.");
  await contentPage.expectTaxonomyChecked("Daily Ops Loop");

  await articlePage.gotoArticle("what-changed-this-week-in-coding-agents");
  await articlePage.expectTaxonomyTerm("Daily Ops Loop");
  await page.getByRole("link", { name: "Daily Ops Loop" }).click();
  await expect(page).toHaveURL(/\/articles\?term=daily-ops-loop$/);
  await expect(
    page.getByRole("link", { name: "What Changed This Week in Coding Agents" }),
  ).toBeVisible();
});
