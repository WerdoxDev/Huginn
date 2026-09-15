import { expect, test } from "@playwright/test";

test("web app starts and renders its root view", async ({ page }) => {
   const pageErrors: Error[] = [];
   page.on("pageerror", (error) => pageErrors.push(error));

   const response = await page.goto("/app/#/login");

   expect(response?.ok()).toBe(true);
   await expect(page).toHaveTitle(/Huginn/i);
   await expect(page.locator("#root")).not.toBeEmpty();
   await expect(page.getByRole("textbox", { name: /Email or Username\s*\*/i })).toBeVisible();
   expect(pageErrors).toEqual([]);
});
