import { test } from "@playwright/test";
import { AdminContentPage } from "./pages/admin-content-page";
import { PublicContentPage } from "./pages/public-content-page";
import { SignInPage } from "./pages/sign-in-page";

test("admin can restore a previous content revision and the public article reflects it", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);
  const adminContentPage = new AdminContentPage(page);
  const articlePage = new PublicContentPage(page);
  const originalExcerpt =
    "A weekly signal post covering the coding-agent changes that matter right now.";
  const revisionOneExcerpt = "Revision one: tighter weekly signal for coding agents.";
  const revisionTwoExcerpt = "Revision two: broader workflow coverage for this signal post.";

  await articlePage.gotoArticle("what-changed-this-week-in-coding-agents");
  await articlePage.expectSummary(originalExcerpt);

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();
  await adminContentPage.gotoList();
  await adminContentPage.openRecord("What Changed This Week in Coding Agents");

  await adminContentPage.updateExcerpt(revisionOneExcerpt);
  await adminContentPage.saveContent();
  await adminContentPage.expectSuccessBanner("Content record saved.");
  await adminContentPage.expectExcerptValue(revisionOneExcerpt);

  await adminContentPage.updateExcerpt(revisionTwoExcerpt);
  await adminContentPage.saveContent();
  await adminContentPage.expectSuccessBanner("Content record saved.");
  await adminContentPage.expectExcerptValue(revisionTwoExcerpt);

  await adminContentPage.restorePreviousRevision();
  await adminContentPage.expectSuccessBanner(
    "Revision restored and captured as a new snapshot.",
  );
  await adminContentPage.expectExcerptValue(revisionOneExcerpt);

  await articlePage.gotoArticle("what-changed-this-week-in-coding-agents");
  await articlePage.expectSummary(revisionOneExcerpt);
});
