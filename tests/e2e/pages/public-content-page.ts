import { expect, type Page } from "@playwright/test";

export class PublicContentPage {
  constructor(private readonly page: Page) {}

  async gotoArticle(slug: string) {
    await this.page.goto(`/articles/${slug}`);
  }

  async expectHeading(title: string) {
    await expect(this.page.getByRole("heading", { name: title })).toBeVisible();
  }

  async expectMissingRelatedSkill(skillTitle: string) {
    await expect(this.page.getByRole("link", { name: skillTitle })).toHaveCount(0);
  }

  async expectTaxonomyTerm(termLabel: string) {
    await expect(this.page.getByRole("link", { name: termLabel })).toBeVisible();
  }

  async expectRelatedSkill(skillTitle: string) {
    await expect(this.page.getByRole("link", { name: skillTitle })).toBeVisible();
  }

  async expectSummary(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async expectBody(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async expectHeroImage(title: string) {
    await expect(
      this.page.getByRole("img", { name: `${title} hero image` }),
    ).toBeVisible();
  }
}
