import { expect, type Locator, type Page } from "@playwright/test";

export class AdminContentPage {
  constructor(private readonly page: Page) {}

  async gotoList() {
    await this.page.goto("/admin/content");
    await expect(
      this.page.getByRole("heading", { name: "Articles and tutorials" }),
    ).toBeVisible();
  }

  async gotoNew() {
    await this.page.goto("/admin/content/new");
    await expect(
      this.page.getByRole("heading", { name: "Create content" }),
    ).toBeVisible();
  }

  async openRecord(title: string) {
    await this.page.getByRole("link", { name: title }).click();
    await expect(
      this.page.getByRole("heading", { name: `Edit content: ${title}` }),
    ).toBeVisible();
  }

  async fillCreateArticleForm(input: {
    title: string;
    excerpt: string;
    body: string;
    heroImageUrl: string;
    canonicalUrl: string;
    seoTitle: string;
    seoDescription: string;
  }) {
    await this.page.getByLabel("Kind").selectOption({ label: "Article" });
    await this.page.getByLabel("Subtype").selectOption({ label: "News" });
    await this.page.getByLabel("Status").selectOption({ label: "Published" });
    await this.page.getByRole("textbox", { name: "Title", exact: true }).fill(input.title);
    await this.page.getByLabel("Excerpt").fill(input.excerpt);
    await this.page.getByLabel("Body").fill(input.body);
    await this.page.getByLabel("Hero image URL").fill(input.heroImageUrl);
    await this.page.getByLabel("Canonical URL override").fill(input.canonicalUrl);
    await this.page.getByLabel("SEO title override").fill(input.seoTitle);
    await this.page.getByLabel("SEO description override").fill(input.seoDescription);
  }

  async updateTitle(text: string) {
    await this.page.getByRole("textbox", { name: "Title", exact: true }).fill(text);
  }

  async expectSlugValue(value: string) {
    await expect(this.page.getByLabel("Slug override")).toHaveValue(value);
  }

  async createContent() {
    await this.page.getByRole("button", { name: "Create content" }).click();
  }

  async expectListSuccessBanner(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectContentListed(title: string) {
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

  async saveRelatedSkill(skillTitle: string) {
    const section = this.getSection("Related skills");
    await section.getByLabel(skillTitle).check();
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

  async expectRelatedSkillChecked(skillTitle: string) {
    await expect(
      this.getSection("Related skills").getByLabel(skillTitle),
    ).toBeChecked();
  }

  async expectHeroImagePreview() {
    await expect(
      this.page.getByRole("img", { name: "Current hero image preview" }),
    ).toBeVisible();
  }

  async updateExcerpt(text: string) {
    await this.page.getByLabel("Excerpt").fill(text);
  }

  async saveContent() {
    await this.page.getByRole("button", { name: "Save content" }).click();
  }

  async expectExcerptValue(text: string) {
    await expect(this.page.getByLabel("Excerpt")).toHaveValue(text);
  }

  async restorePreviousRevision() {
    const revisionSection = this.getSection("Revision history");
    await revisionSection.getByRole("button", { name: "Restore revision" }).first().click();
  }

  private getSection(title: string): Locator {
    return this.page.locator("section").filter({
      has: this.page.getByRole("heading", { name: title }),
    });
  }
}
