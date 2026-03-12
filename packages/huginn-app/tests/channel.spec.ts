import { expect, test } from "@playwright/test";

import { loginUser } from "./test-utils";

test("channel navigation is successful", async ({ page }) => {
   await loginUser(page);
   await page.getByRole("link", { name: "user2, user3, user4 4 Members" }).click();
   await expect(page.getByText("199")).toBeInViewport();
   await page.getByRole("link", { name: "huginn-icon" }).click();
   await expect(page.getByText("Welcome to HuginnStart by")).toBeVisible();
});

test("channel recipients shows and hides successfully", async ({ page }) => {
   await loginUser(page);
   await page.getByRole("link", { name: "user2, user3, user4 4 Members" }).click();
   await expect(page.getByText("Members - 3useruser2user3user4")).toBeInViewport();
   await page
      .locator("div")
      .filter({ hasText: /^user2, user3, user4$/ })
      .locator(".ml-auto > button:nth-child(2)")
      .click();
   await expect(page.getByText("Members - 3useruser2user3user4")).toBeInViewport();
});
