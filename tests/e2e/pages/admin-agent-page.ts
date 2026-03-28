import { expect, type Locator, type Page } from "@playwright/test";

export class AdminAgentPage {
  constructor(private readonly page: Page) {}

  async gotoList() {
    await this.page.goto("/admin/agents");
    await expect(
      this.page.getByRole("heading", { name: "Agent directory" }),
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
