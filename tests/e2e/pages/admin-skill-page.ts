import { expect, type Locator, type Page } from "@playwright/test";

export class AdminSkillPage {
  constructor(private readonly page: Page) {}

  async gotoList() {
    await this.page.goto("/admin/skills");
    await expect(
      this.page.getByRole("heading", { name: "Skills and workflows" }),
    ).toBeVisible();
  }

  async gotoNew() {
    await this.page.goto("/admin/skills/new");
    await expect(
      this.page.getByRole("heading", { name: "Create skill" }),
    ).toBeVisible();
  }

  async openRecord(title: string) {
    const link = this.page
      .locator('a[href^="/admin/skills/"]')
      .filter({ hasText: title })
      .first();

    const href = await link.getAttribute("href");

    if (!href) {
      throw new Error(`Missing admin skill href for ${title}.`);
    }

    await Promise.all([this.page.waitForURL(`**${href}`), link.click()]);
    await expect(
      this.page.getByRole("heading", { name: `Edit skill: ${title}` }),
    ).toBeVisible();
  }

  async fillCreateForm(input: {
    title: string;
    status: string;
    shortDescription: string;
    longDescription: string;
    websiteUrl: string;
    githubUrl: string;
  }) {
    await this.page.getByLabel("Status").selectOption({ label: input.status });
    await this.page.getByRole("textbox", { name: "Title", exact: true }).fill(input.title);
    await this.page.getByLabel("Short description").fill(input.shortDescription);
    await this.page.getByLabel("Long description").fill(input.longDescription);
    await this.page.getByLabel("Website URL").fill(input.websiteUrl);
    await this.page.getByLabel("GitHub URL").fill(input.githubUrl);
  }

  async expectSlugValue(value: string) {
    await expect(this.page.getByLabel("Slug override")).toHaveValue(value);
  }

  async updateTitle(text: string) {
    await this.page.getByRole("textbox", { name: "Title", exact: true }).fill(text);
  }

  async createSkill() {
    await this.page.getByRole("button", { name: "Create skill" }).click();
  }

  async saveSkill() {
    await this.page.getByRole("button", { name: "Save skill" }).click();
  }

  async expectListSuccessBanner(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectSkillListed(title: string) {
    await expect(this.page.getByRole("link", { name: title })).toBeVisible();
  }

  async saveTaxonomy(termLabel: string) {
    const section = this.getSection("Taxonomy");
    await section.getByLabel(termLabel).check();
    await section.getByRole("button", { name: "Save taxonomy" }).click();
  }

  async saveRelatedAgent(agentTitle: string) {
    const section = this.getSection("Related agents");
    await section.getByLabel(agentTitle).check();
    await section.getByRole("button", { name: "Save relations" }).click();
  }

  async expectSuccessBanner(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectTaxonomyChecked(termLabel: string) {
    await expect(this.getSection("Taxonomy").getByLabel(termLabel)).toBeChecked();
  }

  async expectRelatedAgentChecked(agentTitle: string) {
    await expect(
      this.getSection("Related agents").getByLabel(agentTitle),
    ).toBeChecked();
  }

  private getSection(title: string): Locator {
    return this.page.locator("section").filter({
      has: this.page.getByRole("heading", { name: title }),
    });
  }
}
