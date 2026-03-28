import { expect, type Page } from "@playwright/test";

export class PublicPromptPage {
  constructor(private readonly page: Page) {}

  async goto(slug: string) {
    await this.page.goto(`/prompts/${slug}`);
  }

  async expectHeading(title: string) {
    await expect(this.page.getByRole("heading", { name: title })).toBeVisible();
  }

  async expectSummary(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async expectPromptBody(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async expectText(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async expectTaxonomyTerm(termLabel: string) {
    await expect(
      this.page.getByRole("link", { name: termLabel, exact: true }),
    ).toBeVisible();
  }

  async expectMissingRelatedSkill(skillTitle: string) {
    await expect(this.page.getByRole("link", { name: skillTitle })).toHaveCount(0);
  }

  async expectRelatedSkill(skillTitle: string) {
    await expect(this.page.getByRole("link", { name: skillTitle })).toBeVisible();
  }
}
