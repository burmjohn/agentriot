import { test } from "@playwright/test";
import { AdminAgentPage } from "./pages/admin-agent-page";
import { PublicAgentPage } from "./pages/public-agent-page";
import { SignInPage } from "./pages/sign-in-page";

test("admin can create a published agent with an auto-follow slug and expose it publicly", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);
  const adminAgentPage = new AdminAgentPage(page);
  const publicAgentPage = new PublicAgentPage(page);

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();

  await adminAgentPage.gotoNew();
  await adminAgentPage.fillCreateForm({
    title: "Patch Pilot",
    status: "Published",
    shortDescription: "A release-oriented coding agent for shipping small verified changes.",
    longDescription: "Patch Pilot turns release notes, repo context, and issue queues into tightly scoped code changes.",
    websiteUrl: "https://agentriot.com/patch-pilot",
    githubUrl: "https://github.com/burmjohn/agentriot",
    pricingNotes: "Invite-only preview for early testers.",
  });
  await adminAgentPage.expectSlugValue("patch-pilot");
  await adminAgentPage.createAgent();
  await adminAgentPage.expectListSuccessBanner("Agent created.");
  await adminAgentPage.expectAgentListed("Patch Pilot");

  await publicAgentPage.goto("patch-pilot");
  await publicAgentPage.expectHeading("Patch Pilot");
  await publicAgentPage.expectSummary(
    "A release-oriented coding agent for shipping small verified changes.",
  );
  await publicAgentPage.expectBody(
    "Patch Pilot turns release notes, repo context, and issue queues into tightly scoped code changes.",
  );
  await publicAgentPage.expectText("Invite-only preview for early testers.");
});
