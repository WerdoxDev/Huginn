import { expect, test } from "@playwright/test";

test("login flow is successful", async ({ page }) => {
   await page.goto("http://localhost:5173/#/login");
   await page.getByRole("textbox", { name: "Email or Username*" }).click();
   await page.getByRole("textbox", { name: "Email or Username*" }).fill("user");
   await page.getByRole("textbox", { name: "Password*" }).click();
   await page.getByRole("textbox", { name: "Password*" }).fill("user");
   await page.getByRole("button", { name: "Login" }).click();
   await expect(page.getByText("Welcome to HuginnStart by")).toBeVisible();
});

test("login flow results in an error", async ({ page }) => {
   await page.goto("http://localhost:5173/#/login");
   await page.getByRole("textbox", { name: "Email or Username*" }).click();
   await page.getByRole("textbox", { name: "Email or Username*" }).fill("invalid");
   await page.getByRole("textbox", { name: "Password*" }).click();
   await page.getByRole("textbox", { name: "Password*" }).fill("invalid");
   await page.getByRole("button", { name: "Login" }).click();
   await expect(page.getByText("-Login or password is invalid").first()).toBeVisible();
   await expect(page.getByText("-Login or password is invalid").nth(1)).toBeVisible();
});

test("password field have visible text when shown", async ({ page }) => {
   await page.goto("http://localhost:5173/#/login");
   await page.getByRole("textbox", { name: "Password*" }).click();
   await page.getByRole("textbox", { name: "Password*" }).fill("hello");
   await page
      .locator("div")
      .filter({ hasText: /^Password\*$/ })
      .getByRole("button")
      .click();
   await expect(page.getByRole("textbox", { name: "Password*" })).toHaveAttribute("type", "text");
});
