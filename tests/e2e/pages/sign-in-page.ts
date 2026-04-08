import { expect, type Page } from "@playwright/test";

export class SignInPage {
  static readonly adminCredentials = {
    name: "AgentRiot Admin",
    email: "admin@agentriot.com",
    password: "super-secure-password",
  };

  constructor(private readonly page: Page) {}

  private readonly authFailurePattern =
    /Authentication failed\.|Invalid email or password|Admin account was created, but sign-in still needs to complete\./;

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

  async signIn({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) {
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Password").fill(password);
    await this.page
      .locator("form")
      .getByRole("button", { name: "Sign in" })
      .click({ noWaitAfter: true });
  }

  async bootstrapOrSignInAdmin() {
    await this.signIn({
      email: SignInPage.adminCredentials.email,
      password: SignInPage.adminCredentials.password,
    });

    const authOutcome = await Promise.race([
      this.page.waitForURL("**/admin", { timeout: 15_000 }).then(() => "admin"),
      this.page
        .getByText(this.authFailurePattern)
        .waitFor({ state: "visible", timeout: 15_000 })
        .then(() => "failed"),
    ]);

    if (authOutcome === "admin") {
      return;
    }

    {
      const createAdminButton = this.page.getByRole("button", {
        name: "Create admin",
      });

      if ((await createAdminButton.count()) === 0) {
        throw new Error("Admin sign-in failed and bootstrap flow is unavailable.");
      }

      await createAdminButton.click();
      await expect(
        this.page.getByRole("heading", { name: "Create the first admin account" }),
      ).toBeVisible();
      await this.createAdmin(SignInPage.adminCredentials);
    }

    try {
      await this.page.waitForURL("**/admin", { timeout: 15_000 });
    } catch {
      const authError = this.page.getByText(this.authFailurePattern);

      if (await authError.isVisible()) {
        throw new Error(
          "Admin bootstrap stayed on /sign-in after the create-admin submit returned an auth error.",
        );
      }

      throw new Error(
        "Admin bootstrap did not redirect to /admin within 15 seconds.",
      );
    }
  }
}
