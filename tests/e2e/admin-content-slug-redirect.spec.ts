import { expect, test } from "@playwright/test";
import { AdminContentPage } from "./pages/admin-content-page";
import { PublicContentPage } from "./pages/public-content-page";
import { SignInPage } from "./pages/sign-in-page";

test("editing a published article title preserves the old public path via redirect", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);
  const adminContentPage = new AdminContentPage(page);
  const articlePage = new PublicContentPage(page);
  const originalSlug = "what-changed-this-week-in-coding-agents";
  const updatedSlug = "what-changed-this-week-in-agent-workflows";
  const updatedTitle = "What Changed This Week in Agent Workflows";

  await articlePage.gotoArticle(originalSlug);
  await articlePage.expectHeading("What Changed This Week in Coding Agents");

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();
  await adminContentPage.gotoList();
  await adminContentPage.openRecord("What Changed This Week in Coding Agents");
  await adminContentPage.updateTitle(updatedTitle);
  await adminContentPage.expectSlugValue(updatedSlug);
  await adminContentPage.saveContent();
  await adminContentPage.expectSuccessBanner("Content record saved.");

  await page.goto(`/articles/${originalSlug}`);
  await expect(page).toHaveURL(new RegExp(`/articles/${updatedSlug}$`));
  await articlePage.expectHeading(updatedTitle);

  await adminContentPage.gotoList();
  await adminContentPage.openRecord(updatedTitle);
  await adminContentPage.updateTitle("What Changed This Week in Coding Agents");
  await adminContentPage.expectSlugValue(originalSlug);
  await adminContentPage.saveContent();
  await adminContentPage.expectSuccessBanner("Content record saved.");
});
