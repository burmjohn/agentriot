import { expect, type Locator, type Page } from "@playwright/test";

export class AdminPromptPage {
  constructor(private readonly page: Page) {}

  async gotoList() {
    await this.page.goto("/admin/prompts");
    await expect(
      this.page.getByRole("heading", { name: "Prompt library" }),
    ).toBeVisible();
  }

  async openRecord(title: string) {
    const link = this.page
      .locator('a[href^="/admin/prompts/"]')
      .filter({ hasText: title })
      .first();

    const href = await link.getAttribute("href");

    if (!href) {
      throw new Error(`Missing admin prompt href for ${title}.`);
    }

    await Promise.all([this.page.waitForURL(`**${href}`), link.click()]);
    await expect(
      this.page.getByRole("heading", { name: `Edit prompt: ${title}` }),
    ).toBeVisible();
  }

  async saveTaxonomy(termLabel: string) {
    const section = this.getSection("Taxonomy");
    await section.getByLabel(termLabel).check();
    await section.getByRole("button", { name: "Save taxonomy" }).click();
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

  async expectRelatedSkillChecked(skillTitle: string) {
    await expect(
      this.getSection("Related skills").getByLabel(skillTitle),
    ).toBeChecked();
  }

  private getSection(title: string): Locator {
    return this.page.locator("section").filter({
      has: this.page.getByRole("heading", { name: title }),
    });
  }
}
