import test, { expect } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

test('oauth flow is successful', async ({ page }) => {
   await page.goto('http://localhost:5173/#/login');
   await page.getByRole('button', { name: 'Google' }).click();
   await page.getByRole('textbox', { name: 'Email or Phone' }).click();
   await page.getByRole('textbox', { name: 'Email or Phone' }).fill(process.env.PLAYWRIGHT_OAUTH_EMAIL ?? "");
   await page.getByRole('textbox', { name: 'Email or Phone' }).press('Enter');
   await page.getByRole('textbox', { name: 'Password' }).fill(process.env.PLAYWRIGHT_OAUTH_PASSWORD ?? "");
   await page.getByRole('textbox', { name: 'Password' }).press('Enter');
   await page.getByRole('button', { name: 'Allow' }).click();
   await expect(page.getByText('Welcome to HuginnStart by')).toBeVisible();
});
