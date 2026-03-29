import { expect, type APIRequestContext, type Page } from "@playwright/test";

export class AdminApiKeysPage {
  constructor(private readonly page: Page) {}

  async gotoList() {
    await this.page.goto("/admin/api-keys");
    await expect(
      this.page.getByRole("heading", { name: "API keys" }),
    ).toBeVisible();
  }

  async gotoNew() {
    await this.page.goto("/admin/api-keys/new");
    await expect(
      this.page.getByRole("heading", { name: "Create API key" }),
    ).toBeVisible();
  }

  async fillCreateForm(input: {
    label: string;
    description: string;
    expiresAt: string;
    scopes: string[];
  }) {
    await this.page.getByLabel("Label").fill(input.label);
    await this.page.getByLabel("Description").fill(input.description);
    await this.page.getByLabel("Expires at").fill(input.expiresAt);

    for (const scope of input.scopes) {
      await this.page.getByLabel(scope).check();
    }
  }

  async createKey() {
    await this.page.getByRole("button", { name: "Create key" }).click();
  }

  async openRecord(label: string) {
    await this.page.getByRole("link", { name: label }).click();
    await expect(
      this.page.getByRole("heading", { name: `Edit API key: ${label}` }),
    ).toBeVisible();
  }

  async revealSecret() {
    await this.page.getByRole("button", { name: "Reveal secret" }).click();
  }

  async updateLabel(nextLabel: string) {
    await this.page.getByLabel("Label").fill(nextLabel);
  }

  async saveKey() {
    await this.page.getByRole("button", { name: "Save key" }).click();
  }

  async revokeKey() {
    await this.page.getByRole("button", { name: "Revoke key" }).click();
  }

  async reactivateKey() {
    await this.page.getByRole("button", { name: "Reactivate key" }).click();
  }

  async expectSuccessBanner(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectStatus(text: string) {
    await expect(
      this.page.getByText(`Status: ${text}`, { exact: true }),
    ).toBeVisible();
  }

  async expectSecretVisible() {
    await expect(this.page.getByTestId("api-key-secret")).toContainText("ar_live_");
  }

  async readSecret() {
    return (await this.page.getByTestId("api-key-secret").textContent()) ?? "";
  }

  async expectListed(label: string) {
    await expect(this.page.getByRole("link", { name: label })).toBeVisible();
  }

  async expectIngestionRejectedForRevokedKey(
    request: APIRequestContext,
    token: string,
  ) {
    const response = await request.post("/api/v1/ingest/articles", {
      data: {
        title: "Revoked publish",
        status: "published",
      },
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "idempotency-key": "revoked-key-test",
      },
    });

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "api_key_revoked",
      },
    });
  }
}
