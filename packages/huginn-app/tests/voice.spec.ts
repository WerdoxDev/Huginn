import { chromium, expect, test } from "@playwright/test";
import { goToChannel, loginUser } from "./test-utils";

test("voice connection is successful", async ({ page }) => {
   await loginUser(page);
   await goToChannel(page);
   await page.locator('div').filter({ hasText: /^user2, user3, user4$/ }).locator('.ml-auto > button:nth-child(1)').click();
   await expect(page.locator('.p-5').first()).toBeInViewport();
   await expect(page.locator('div').filter({ hasText: /^Connected$/ }).first()).toBeInViewport();
})

test("screensharing works successfully", async ({ headless }) => {
   const browser = await chromium.launch({
      headless: headless, args: ['--use-fake-ui-for-media-stream',
         '--use-fake-device-for-media-stream',
         '--allow-http-screen-capture']
   });

   const context = await browser.newContext();
   const page = await context.newPage();

   await loginUser(page);
   await goToChannel(page);
   await page.locator('div').filter({ hasText: /^user2, user3, user4$/ }).locator('.ml-auto > button:nth-child(1)').click();
   await page.locator('.flex.w-full.shrink').hover();
   await page.locator('.cursor-pointer.flex.h-full').first().click();
   await expect(page.locator('video')).toBeInViewport();
})

test("camera works successfully", async ({ headless }) => {
   const browser = await chromium.launch({
      headless: headless, args: ['--use-fake-ui-for-media-stream',
         '--use-fake-device-for-media-stream',
         '--allow-http-screen-capture']
   });

   const context = await browser.newContext();
   const page = await context.newPage();

   await loginUser(page);
   await goToChannel(page);
   await page.locator('div').filter({ hasText: /^user2, user3, user4$/ }).locator('.ml-auto > button:nth-child(1)').click();
   await page.locator('.flex.w-full.shrink').hover();
   await page.locator('div:nth-child(4) > button').click();
   await expect(page.locator('.group\\/element.relative.flex.shrink-0.flex-col.items-center.justify-center.gap-y-1.shadow-md.transition-shadow.hover\\:shadow-xl.aspect-video.overflow-hidden.p-0.bg-surface > .p-5')).not.toBeInViewport();
   await expect(page.locator('video')).toBeInViewport();
})
