import { expect, test } from "@playwright/test";

// video.webm is a generated 12-second VP8/Vorbis clip with no external content.
test("opens a nonplaying message preview, retains fullscreen playback, and dismisses without audio", async ({ page, isMobile }) => {
   const errors: Error[] = [];
   page.on("pageerror", (error) => errors.push(error));
   await page.goto("/app/tests/fixtures/media-viewer.html");
   const opener = page.getByRole("button", { name: "Open video" });
   const preview = opener.locator("video");
   await expect(preview).toHaveJSProperty("paused", true);
   await expect(preview).toHaveJSProperty("controls", false);
   await opener.click();
   const dialog = page.getByRole("dialog");
   const video = dialog.locator("video");
   await expect(video).toHaveJSProperty("paused", false);
   await expect(video).toHaveJSProperty("volume", 0.37);
   await expect(video).toHaveJSProperty("loop", false);
   await expect(dialog.getByRole("button", { name: "Pause" })).toBeVisible();
   const bounds = await video.boundingBox();
   expect(bounds!.width / bounds!.height).toBeCloseTo(16 / 9, 1);
   if (isMobile) {
      await dialog.getByRole("button", { name: "Mute" }).click();
      await expect(video).toHaveJSProperty("volume", 0);
      await expect(dialog.getByRole("button", { name: "Unmute" })).toBeHidden();
      await video.tap();
      await dialog.getByRole("button", { name: "Unmute" }).click();
      await expect(video).toHaveJSProperty("volume", 0.37);
   }

   // Keep a reference to verify that fullscreen and dismissal preserve/stop this session.
   const session = await video.elementHandle();
   await dialog.getByRole("button", { name: "Pause" }).click();
   await expect(video).toHaveJSProperty("paused", true);
   await video.evaluate((element: HTMLVideoElement) => {
      element.currentTime = 2;
   });
   await dialog.getByRole("button", { name: /^Fullscreen$/ }).click();
   await expect(page.locator(":fullscreen")).toBeVisible();
   await expect(video).toHaveJSProperty("currentTime", 2);
   await expect(video).toHaveJSProperty("paused", true);
   await dialog.getByRole("button", { name: "Exit fullscreen" }).click();
   await expect(page.locator(":fullscreen")).toHaveCount(0);
   await expect(dialog).toBeVisible();
   expect(await session!.evaluate((element) => element === document.querySelector('[role="dialog"] video'))).toBe(true);
   await expect(video).toHaveJSProperty("currentTime", 2);

   await dialog.getByRole("button", { name: "Play", exact: true }).click();
   await expect(video).toHaveJSProperty("paused", false);
   // A click on the viewer backdrop dismisses through the normal portal lifecycle.
   await dialog.click({ position: { x: 8, y: 80 } });
   await expect(dialog).toHaveCount(0);
   expect(await session!.evaluate((element: HTMLVideoElement) => element.paused && !element.getAttribute("src"))).toBe(true);
   await opener.click();
   await expect(video).toHaveJSProperty("paused", false);
   expect(await video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeLessThan(2);
   await dialog.getByRole("button", { name: "Close media viewer" }).click();
   await expect(dialog).toHaveCount(0);
   expect(errors).toEqual([]);
});
