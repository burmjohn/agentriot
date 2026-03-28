import { test } from "@playwright/test";
import { AdminContentPage } from "./pages/admin-content-page";
import { PublicContentPage } from "./pages/public-content-page";
import { SignInPage } from "./pages/sign-in-page";

test("admin can create a published article with an auto-follow slug and expose it publicly", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);
  const adminContentPage = new AdminContentPage(page);
  const articlePage = new PublicContentPage(page);

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();

  await adminContentPage.gotoNew();
  await adminContentPage.fillCreateArticleForm({
    title: "Agent Release Triage Notes",
    excerpt: "A compact article for sorting agent release noise into real next steps.",
    body: "Track the releases, explain what changed, and turn the noise into actions worth shipping this week.",
    heroImageUrl: "https://agentriot.com/og/agent-release-triage-notes.png",
    canonicalUrl: "https://agentriot.com/articles/agent-release-triage-notes",
    seoTitle: "Agent release triage for agentic coders",
    seoDescription: "Sort agent release noise into the next actions that actually matter.",
  });
  await adminContentPage.expectSlugValue("agent-release-triage-notes");
  await adminContentPage.createContent();
  await adminContentPage.expectListSuccessBanner("Content record created.");
  await adminContentPage.expectContentListed("Agent Release Triage Notes");

  await articlePage.gotoArticle("agent-release-triage-notes");
  await articlePage.expectHeading("Agent Release Triage Notes");
  await articlePage.expectSummary(
    "A compact article for sorting agent release noise into real next steps.",
  );
  await articlePage.expectBody(
    "Track the releases, explain what changed, and turn the noise into actions worth shipping this week.",
  );
  await articlePage.expectHeroImage("Agent Release Triage Notes");
});
