import { expect, type Page } from "@playwright/test";

export class PublicSkillPage {
  constructor(private readonly page: Page) {}

  async goto(slug: string) {
    await this.page.goto(`/skills/${slug}`);
  }

  async expectTaxonomyTerm(termLabel: string) {
    await expect(
      this.page.getByRole("link", { name: termLabel, exact: true }),
    ).toBeVisible();
  }

  async expectMissingRelatedAgent(agentTitle: string) {
    await expect(this.page.getByRole("link", { name: agentTitle })).toHaveCount(0);
  }

  async expectRelatedAgent(agentTitle: string) {
    await expect(this.page.getByRole("link", { name: agentTitle })).toBeVisible();
  }
}
