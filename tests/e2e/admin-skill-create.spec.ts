import { test } from "@playwright/test";
import { AdminSkillPage } from "./pages/admin-skill-page";
import { PublicSkillPage } from "./pages/public-skill-page";
import { SignInPage } from "./pages/sign-in-page";

test("admin can create a published skill with an auto-follow slug and expose it publicly", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);
  const adminSkillPage = new AdminSkillPage(page);
  const publicSkillPage = new PublicSkillPage(page);

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();

  await adminSkillPage.gotoNew();
  await adminSkillPage.fillCreateForm({
    title: "Release Radar",
    status: "Published",
    shortDescription: "Turn noisy AI release streams into a ranked watchlist.",
    longDescription: "Release Radar gathers model, framework, and agent updates into a repeatable triage workflow.",
    websiteUrl: "https://agentriot.com/release-radar",
    githubUrl: "https://github.com/burmjohn/agentriot",
  });
  await adminSkillPage.expectSlugValue("release-radar");
  await adminSkillPage.createSkill();
  await adminSkillPage.expectListSuccessBanner("Skill created.");
  await adminSkillPage.expectSkillListed("Release Radar");

  await publicSkillPage.goto("release-radar");
  await publicSkillPage.expectHeading("Release Radar");
  await publicSkillPage.expectSummary("Turn noisy AI release streams into a ranked watchlist.");
  await publicSkillPage.expectBody(
    "Release Radar gathers model, framework, and agent updates into a repeatable triage workflow.",
  );
});
