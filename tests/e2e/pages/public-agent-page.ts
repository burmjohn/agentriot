import { expect, type Page } from "@playwright/test";

export class PublicAgentPage {
  constructor(private readonly page: Page) {}

  async goto(slug: string) {
    await this.page.goto(`/agents/${slug}`);
  }

  async expectTaxonomyTerm(termLabel: string) {
    await expect(
      this.page.getByRole("link", { name: termLabel, exact: true }),
    ).toBeVisible();
  }

  async expectMissingPrompt(promptTitle: string) {
    await expect(this.page.getByRole("link", { name: promptTitle })).toHaveCount(0);
  }

  async expectRelatedPrompt(promptTitle: string) {
    await expect(this.page.getByRole("link", { name: promptTitle })).toBeVisible();
  }
}
