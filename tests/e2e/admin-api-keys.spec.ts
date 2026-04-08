import { test } from "@playwright/test";
import { AdminApiKeysPage } from "./pages/admin-api-keys-page";
import { SignInPage } from "./pages/sign-in-page";

function getActiveExpiryValue() {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    .toISOString()
    .slice(0, 16);
}

test("admin can create, reveal, edit, revoke, reactivate, and inspect an API key", async ({
  page,
  request,
}) => {
  const signInPage = new SignInPage(page);
  const apiKeysPage = new AdminApiKeysPage(page);

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();

  await apiKeysPage.gotoNew();
  await apiKeysPage.fillCreateForm({
    label: "Automation publisher",
    description: "Trusted machine writer",
    expiresAt: getActiveExpiryValue(),
    scopes: ["content:write", "admin:*"],
  });
  await apiKeysPage.createKey();
  await apiKeysPage.expectSuccessBanner("API key created.");
  await apiKeysPage.expectSecretVisible();

  const token = await apiKeysPage.readSecret();

  await apiKeysPage.gotoList();
  await apiKeysPage.expectListed("Automation publisher");
  await apiKeysPage.openRecord("Automation publisher");
  await apiKeysPage.revealSecret();
  await apiKeysPage.expectSecretVisible();
  await apiKeysPage.updateLabel("Automation publisher updated");
  await apiKeysPage.saveKey();
  await apiKeysPage.expectSuccessBanner("API key saved.");
  await apiKeysPage.revokeKey();
  await apiKeysPage.expectSuccessBanner("API key revoked.");
  await apiKeysPage.expectStatus("revoked");
  await apiKeysPage.expectIngestionRejectedForRevokedKey(request, token);
  await apiKeysPage.reactivateKey();
  await apiKeysPage.expectSuccessBanner("API key reactivated.");
  await apiKeysPage.expectStatus("active");
});
