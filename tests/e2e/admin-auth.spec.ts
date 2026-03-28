import { expect, test } from "@playwright/test";
import { SignInPage } from "./pages/sign-in-page";

test("allowlisted admin can bootstrap the first account and reach the console", async ({
  page,
}) => {
  const signInPage = new SignInPage(page);

  await signInPage.goto();
  await signInPage.switchToCreateAdmin();
  await signInPage.createAdmin({
    name: "AgentRiot Admin",
    email: "admin@agentriot.com",
    password: "super-secure-password",
  });

  await expect
    .poll(async () => {
      const cookies = await page.context().cookies();

      return cookies.some((cookie) => cookie.name === "better-auth.session_token");
    })
    .toBe(true);

  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Thin content ops surface" }),
  ).toBeVisible();
  await expect(page.getByText("Signed in as admin@agentriot.com.")).toBeVisible();
  await page.getByRole("link", { name: "Content", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Articles and tutorials" }),
  ).toBeVisible();
});
