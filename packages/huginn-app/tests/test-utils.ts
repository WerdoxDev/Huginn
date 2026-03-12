import { expect, type Page } from "@playwright/test";

export async function loginUser(page: Page) {
   await page.goto("http://localhost:5173/#/login");
   await page.getByRole("textbox", { name: "Email or Username*" }).fill("user");
   await page.getByRole("textbox", { name: "Password*" }).fill("user");
   await page.getByRole("button", { name: "Login" }).click();
   await expect(page.getByText("Welcome to HuginnStart by")).toBeVisible();
}

export async function goToChannel(page: Page) {
   await page.getByRole("link", { name: "user2, user3, user4 4 Members" }).click();
   await expect(page.getByText("Members - 3useruser2user3user4")).toBeInViewport();
}
