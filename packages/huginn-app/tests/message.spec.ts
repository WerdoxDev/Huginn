import test, { expect } from "@playwright/test";

import { goToChannel, loginUser } from "./test-utils";

test("sending message is successful", async ({ page }) => {
   await loginUser(page);
   await goToChannel(page);
   await page.getByRole("textbox").first().click();
   await page.getByRole("textbox").first().pressSequentially("hello");
   await page.locator("form").getByRole("button").nth(1).click();
   await expect(page.locator("ol").locator("li").last().getByText("hello")).toBeInViewport();
});
