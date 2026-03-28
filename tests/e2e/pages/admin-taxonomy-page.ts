import { expect, type Page } from "@playwright/test";

export class AdminTaxonomyPage {
  constructor(private readonly page: Page) {}

  async gotoList() {
    await this.page.goto("/admin/taxonomy");
    await expect(
      this.page.getByRole("heading", { name: "Shared scoped terms" }),
    ).toBeVisible();
  }

  async gotoNew() {
    await this.page.goto("/admin/taxonomy/new");
    await expect(
      this.page.getByRole("heading", { name: "Create taxonomy term" }),
    ).toBeVisible();
  }

  async createTerm({
    scope,
    kind,
    label,
    slug,
    description,
  }: {
    scope: "content" | "agent" | "prompt" | "skill";
    kind: "category" | "tag" | "type";
    label: string;
    slug: string;
    description: string;
  }) {
    await this.page.getByLabel("Scope").selectOption(scope);
    await this.page.getByLabel("Kind").selectOption(kind);
    await this.page.getByLabel("Label").fill(label);
    await this.page.getByLabel("Slug override").fill(slug);
    await this.page.getByLabel("Description").fill(description);
    await this.page.getByRole("button", { name: "Create term" }).click();
  }

  async openTerm(label: string) {
    await this.page.getByRole("link", { name: label }).click();
    await expect(
      this.page.getByRole("heading", { name: `Edit term: ${label}` }),
    ).toBeVisible();
  }

  async updateLabel(label: string) {
    await this.page.getByLabel("Label").fill(label);
  }

  async saveTerm() {
    await this.page.getByRole("button", { name: "Save term" }).click();
  }

  async expectSuccessBanner(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}
