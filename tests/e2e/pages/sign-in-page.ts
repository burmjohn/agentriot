import { expect, type Page } from "@playwright/test";

export class SignInPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/sign-in");
    await expect(
      this.page.getByRole("heading", { name: "Sign in to the admin console" }),
    ).toBeVisible();
  }

  async expectBootstrapDisabled() {
    await expect(
      this.page.getByText(
        "Admin account creation is currently disabled because `ADMIN_EMAIL_ALLOWLIST` is empty.",
      ),
    ).toBeVisible();
    await expect(this.page.getByRole("tab", { name: "Create admin" })).toHaveCount(0);
  }

  async switchToCreateAdmin() {
    await this.page.getByRole("button", { name: "Create admin" }).click();
    await expect(
      this.page.getByRole("heading", { name: "Create the first admin account" }),
    ).toBeVisible();
  }

  async createAdmin({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }) {
    await this.page.getByLabel("Name").fill(name);
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Password").fill(password);
    await this.page
      .getByRole("button", { name: "Create admin account" })
      .click({ noWaitAfter: true });
  }
}
