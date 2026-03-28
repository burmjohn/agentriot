import { expect, test } from "@playwright/test";
import { SignInPage } from "./pages/sign-in-page";

test("allowlisted admin can bootstrap the first account and reach the console", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);

  await signInPage.goto();
  await signInPage.bootstrapOrSignInAdmin();
  await expect(
    page.getByRole("heading", { name: "Thin content ops surface" }),
  ).toBeVisible();
  await expect(page.getByText("Signed in as admin@agentriot.com.")).toBeVisible();
  await page.getByRole("link", { name: "Content", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Articles and tutorials" }),
  ).toBeVisible();
});
