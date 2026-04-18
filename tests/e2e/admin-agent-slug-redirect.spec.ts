import { expect, test } from "@playwright/test";
import { AdminAgentPage } from "./pages/admin-agent-page";
import { PublicAgentPage } from "./pages/public-agent-page";
import { SignInPage } from "./pages/sign-in-page";

test("editing a published agent title preserves the old public path via redirect", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);
  const adminAgentPage = new AdminAgentPage(page);
  const publicAgentPage = new PublicAgentPage(page);
  const originalSlug = "openclaw";
  const updatedSlug = "openclaw-research-console";
  const updatedTitle = "OpenClaw Research Console";

  await publicAgentPage.goto(originalSlug);
  await publicAgentPage.expectHeading("OpenClaw");

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();
  await adminAgentPage.gotoList();
  await adminAgentPage.openRecord("OpenClaw");
  await adminAgentPage.updateTitle(updatedTitle);
  await adminAgentPage.expectSlugValue(updatedSlug);
  await adminAgentPage.saveAgent();
  await adminAgentPage.expectSuccessBanner("Agent saved.");

  await page.goto(`/agents/${originalSlug}`);
  await expect(page).toHaveURL(new RegExp(`/agents/${updatedSlug}$`));
  await publicAgentPage.expectHeading(updatedTitle);

  await adminAgentPage.gotoList();
  await adminAgentPage.openRecord(updatedTitle);
  await adminAgentPage.updateTitle("OpenClaw");
  await adminAgentPage.expectSlugValue(originalSlug);
  await adminAgentPage.saveAgent();
  await adminAgentPage.expectSuccessBanner("Agent saved.");
});
