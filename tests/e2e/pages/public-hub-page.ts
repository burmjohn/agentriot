import { expect, type Page } from "@playwright/test";

export class PublicHubPage {
  constructor(private readonly page: Page) {}

  async gotoHome() {
    await this.page.goto("/");
    await expect(
      this.page.getByRole("heading", {
        name: "Track what changed in AI. Find what to use next.",
      }),
    ).toBeVisible();
  }

  async openLeadStory() {
    const leadStoryLink = this.page.getByRole("link", {
      name: "See current signal",
      exact: true,
    });

    await expect(leadStoryLink).toHaveAttribute(
      "href",
      /\/articles\/what-changed-this-week-in-coding-agents$/,
    );
    await Promise.all([
      this.page.waitForURL(/\/articles\/what-changed-this-week-in-coding-agents$/),
      leadStoryLink.click(),
    ]);
  }

  async gotoSearch(query: string) {
    await this.page.goto(`/search?q=${encodeURIComponent(query)}`);
    await expect(this.page.getByRole("heading", { name: "Search the graph" })).toBeVisible();
  }
}
