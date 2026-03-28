import { test } from "@playwright/test";
import { AdminPromptPage } from "./pages/admin-prompt-page";
import { PublicPromptPage } from "./pages/public-prompt-page";
import { SignInPage } from "./pages/sign-in-page";

test("admin can create a published prompt with an auto-follow slug and expose it publicly", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);
  const adminPromptPage = new AdminPromptPage(page);
  const publicPromptPage = new PublicPromptPage(page);

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();

  await adminPromptPage.gotoNew();
  await adminPromptPage.fillCreateForm({
    title: "Signal Triage Loop",
    status: "Published",
    shortDescription: "Triage scattered AI updates into the next actions that matter.",
    fullDescription: "A reusable prompt for sorting noisy updates into a concrete build queue.",
    promptBody:
      "Review these AI updates, rank them by impact on agentic coding workflows, and produce the next three actions to take.",
    providerCompatibility: "GPT-5.4, Claude",
    variablesSchema: "updates, project_context",
    exampleOutput: "Ranked changes, risk notes, recommended next actions.",
  });
  await adminPromptPage.expectSlugValue("signal-triage-loop");
  await adminPromptPage.createPrompt();
  await adminPromptPage.expectListSuccessBanner("Prompt created.");
  await adminPromptPage.expectPromptListed("Signal Triage Loop");

  await publicPromptPage.goto("signal-triage-loop");
  await publicPromptPage.expectHeading("Signal Triage Loop");
  await publicPromptPage.expectSummary(
    "Triage scattered AI updates into the next actions that matter.",
  );
  await publicPromptPage.expectPromptBody(
    "Review these AI updates, rank them by impact on agentic coding workflows, and produce the next three actions to take.",
  );
  await publicPromptPage.expectText("GPT-5.4, Claude");
});
