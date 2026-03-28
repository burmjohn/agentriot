import { expect, type Locator, type Page } from "@playwright/test";

export class AdminAgentPage {
  constructor(private readonly page: Page) {}

  async gotoList() {
    await this.page.goto("/admin/agents");
    await expect(
      this.page.getByRole("heading", { name: "Agent directory" }),
    ).toBeVisible();
  }

  async gotoNew() {
    await this.page.goto("/admin/agents/new");
    await expect(
      this.page.getByRole("heading", { name: "Create agent" }),
    ).toBeVisible();
  }

  async openRecord(title: string) {
    const link = this.page
      .locator('a[href^="/admin/agents/"]')
      .filter({ hasText: title })
      .first();

    const href = await link.getAttribute("href");

    if (!href) {
      throw new Error(`Missing admin agent href for ${title}.`);
    }

    await Promise.all([this.page.waitForURL(`**${href}`), link.click()]);
    await expect(
      this.page.getByRole("heading", { name: `Edit agent: ${title}` }),
    ).toBeVisible();
  }

  async fillCreateForm(input: {
    title: string;
    status: string;
    shortDescription: string;
    longDescription: string;
    websiteUrl: string;
    githubUrl: string;
    pricingNotes: string;
  }) {
    await this.page.getByLabel("Status").selectOption({ label: input.status });
    await this.page.getByRole("textbox", { name: "Title", exact: true }).fill(input.title);
    await this.page.getByLabel("Short description").fill(input.shortDescription);
    await this.page.getByLabel("Long description").fill(input.longDescription);
    await this.page.getByLabel("Website URL").fill(input.websiteUrl);
    await this.page.getByLabel("GitHub URL").fill(input.githubUrl);
    await this.page.getByLabel("Pricing notes").fill(input.pricingNotes);
  }

  async expectSlugValue(value: string) {
    await expect(this.page.getByLabel("Slug override")).toHaveValue(value);
  }

  async createAgent() {
    await this.page.getByRole("button", { name: "Create agent" }).click();
  }

  async expectListSuccessBanner(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectAgentListed(title: string) {
    await expect(this.page.getByRole("link", { name: title })).toBeVisible();
  }

  async saveTaxonomy(termLabel: string) {
    const section = this.getSection("Taxonomy");
    await section.getByLabel(termLabel).check();
    await section.getByRole("button", { name: "Save taxonomy" }).click();
  }

  async saveRelatedPrompt(promptTitle: string) {
    const section = this.getSection("Related prompts");
    await section.getByLabel(promptTitle).check();
    await section.getByRole("button", { name: "Save relations" }).click();
  }

  async expectSuccessBanner(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectTaxonomyChecked(termLabel: string) {
    await expect(this.getSection("Taxonomy").getByLabel(termLabel)).toBeChecked();
  }

  async expectRelatedPromptChecked(promptTitle: string) {
    await expect(
      this.getSection("Related prompts").getByLabel(promptTitle),
    ).toBeChecked();
  }

  private getSection(title: string): Locator {
    return this.page.locator("section").filter({
      has: this.page.getByRole("heading", { name: title }),
    });
  }
}
