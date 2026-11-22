import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({ baseURL: "http://127.0.0.1:4174", viewport: { width: 1280, height: 800 } });

async function openMedia(page: Page, kind: "Video" | "Image" | "Expression" = "Video") {
   await page.goto("/app/tests/fixtures/media-viewer.html");
   await page
      .getByRole("region", { name: `${kind} message` })
      .locator("video, img")
      .click();
   const dialog = page.getByRole("dialog");
   const picture = dialog.locator("video, img");
   await expect(picture).toBeVisible();
   if (kind === "Image") await expect.poll(() => picture.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBe(640);
   else await expect.poll(() => picture.evaluate((el) => (el as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2);
   await dialog.evaluate(async (element) => {
      await Promise.all(
         element
            .getAnimations({ subtree: true })
            .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
            .map((animation) => animation.finished),
      );
   });
   return { dialog, picture };
}

async function box(picture: Locator) {
   return (await picture.boundingBox())!;
}

async function wheel(page: Page, picture: Locator, deltaY: number, count = 1) {
   const b = await box(picture);
   const viewport = page.viewportSize()!;
   await page.mouse.move(
      Math.min(viewport.width - 100, Math.max(100, b.x + b.width / 2)),
      Math.min(viewport.height - 150, Math.max(150, b.y + b.height / 2)),
   );
   const initial = b.width;
   for (let i = 0; i < count; i++) {
      await page.mouse.wheel(0, deltaY);
      // Each native wheel event must be delivered before measuring or issuing the next step.
      await page.waitForFunction(() => new Promise(requestAnimationFrame));
   }
   if (deltaY < 0 && initial < 3200) await expect.poll(async () => (await box(picture)).width).toBeGreaterThan(initial);
}

async function drag(page: Page, button: "left" | "middle" | "right", ctrl = false, dx = 80) {
   await page.mouse.move(550, 350);
   if (ctrl) await page.keyboard.down("Control");
   await page.mouse.down({ button });
   await page.mouse.move(550 + dx, 380, { steps: 5 });
   await page.mouse.up({ button });
   if (ctrl) await page.keyboard.up("Control");
}

test("video wheel/pan mappings keep controls fixed and suppress gesture clicks", async ({ page }) => {
   const { dialog, picture } = await openMedia(page);
   const fitted = await box(picture);
   const fullscreen = dialog.getByRole("button", { name: "Fullscreen", exact: true });
   await page.mouse.move(20, 750);
   await expect(fullscreen).not.toBeInViewport();
   await picture.hover();
   await expect(fullscreen).toBeInViewport();
   const controls = await box(fullscreen);
   await wheel(page, picture, -100, 10);
   const zoomed = await box(picture);
   expect(zoomed.width).toBeGreaterThan(fitted.width * 2);
   await expect.poll(async () => (await box(fullscreen)).x).toBeCloseTo(controls.x, 1);
   await drag(page, "left", true);
   const panned = await box(picture);
   expect(panned.x).toBeGreaterThan(zoomed.x + 50);
   expect(await picture.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(false);
   await drag(page, "middle");
   expect((await box(picture)).x).toBeGreaterThan(panned.x + 50);
   const beforeRight = await box(picture);
   await page.evaluate(() =>
      document.addEventListener("contextmenu", (event) => {
         document.body.dataset.contextPrevented = String(event.defaultPrevented);
      }),
   );
   await drag(page, "right");
   expect((await box(picture)).x).toBeCloseTo(beforeRight.x, 1);
   await expect(page.locator("body")).toHaveAttribute("data-context-prevented", "false");
   await drag(page, "left");
   expect((await box(picture)).x).toBeCloseTo(beforeRight.x, 1);
   // Desktop ordinary click controls playback, including while zoomed.
   const paused = await picture.evaluate((el) => (el as HTMLVideoElement).paused);
   await page.mouse.click(550, 350);
   await expect.poll(() => picture.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(!paused);
   await expect(dialog).toBeVisible();
});

test("video controls seek, change volume, and ignore wheel/pan while zoomed", async ({ page }) => {
   const { dialog, picture } = await openMedia(page);
   await wheel(page, picture, -100, 10);
   const before = await box(picture);
   const pause = dialog.getByRole("button", { name: "Pause", exact: true });
   await pause.click();
   const slider = dialog.getByRole("slider").first();
   await slider.focus();
   await page.keyboard.press("ArrowRight");
   expect(await picture.evaluate((el) => (el as HTMLVideoElement).currentTime)).toBeGreaterThan(0);
   await dialog.getByRole("button", { name: "Mute", exact: true }).click();
   expect(await picture.evaluate((el) => (el as HTMLVideoElement).volume)).toBe(0);
   const mute = dialog.getByRole("button", { name: "Unmute" });
   await mute.hover();
   await page.mouse.wheel(0, -100);
   const volume = dialog.getByRole("slider").nth(1);
   await volume.focus();
   await page.keyboard.press("ArrowUp");
   expect(await picture.evaluate((el) => (el as HTMLVideoElement).volume)).toBeGreaterThan(0);
   const controlBox = await box(slider);
   await page.mouse.move(controlBox.x + controlBox.width / 2, controlBox.y + controlBox.height / 2);
   await page.keyboard.down("Control");
   await page.mouse.down();
   await page.mouse.move(controlBox.x + controlBox.width * 0.7, controlBox.y + controlBox.height / 2);
   await page.mouse.up();
   await page.keyboard.up("Control");
   expect(await box(picture)).toEqual(before);
   expect(await picture.evaluate((el) => (el as HTMLVideoElement).paused)).toBe(true);
});

for (const kind of ["Image", "Expression"] as const) {
   test(`${kind} retains click zoom, left/middle pan, right context menu, and bounded zoom`, async ({ page }) => {
      const { dialog, picture } = await openMedia(page, kind);
      const fitted = await box(picture);
      await picture.click();
      await expect.poll(async () => (await box(picture)).width).toBeCloseTo(fitted.width * 2, 1);
      await wheel(page, picture, -100);
      const zoomed = await box(picture);
      await drag(page, "left");
      expect((await box(picture)).x).toBeGreaterThan(zoomed.x + 50);
      const panned = await box(picture);
      await drag(page, "middle");
      expect((await box(picture)).x).toBeGreaterThanOrEqual(panned.x);
      const beforeRight = await box(picture);
      await drag(page, "right");
      expect(await box(picture)).toEqual(beforeRight);
      await wheel(page, picture, -100, 30);
      await expect.poll(async () => (await box(picture)).width).toBeCloseTo(fitted.width * 5, 1);
      await drag(page, "left", false, 4000);
      const bounded = await box(picture);
      expect(bounded.x).toBeLessThanOrEqual(64);
      expect(bounded.x + bounded.width).toBeGreaterThanOrEqual(1216);
      await wheel(page, picture, 100, 40);
      await expect.poll(async () => (await box(picture)).width).toBeCloseTo(fitted.width, 1);
      await expect(dialog).toBeVisible();
   });
}

test("native fullscreen fits the video, bypasses gestures, and restores the paused viewer session", async ({ page, context }) => {
   const { dialog, picture } = await openMedia(page);
   await wheel(page, picture, -100, 10);
   await drag(page, "left", true);
   await picture.evaluate((el) => {
      const v = el as HTMLVideoElement;
      v.pause();
      v.currentTime = 7;
   });
   const framing = await box(picture);
   await dialog.getByRole("button", { name: "Mute", exact: true }).click();
   await dialog.getByRole("button", { name: "Fullscreen", exact: true }).click();
   await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
   const fullscreenBox = await box(picture);
   expect(fullscreenBox.width).toBeLessThanOrEqual(1280);
   expect(fullscreenBox.height).toBeLessThanOrEqual(800);
   await page.mouse.move(550, 350);
   await page.mouse.wheel(0, -100);
   await drag(page, "middle");
   expect(await box(picture)).toEqual(fullscreenBox);
   // Native fullscreen can resize the viewport while the saved viewer framing stays intact.
   const session = await context.newCDPSession(page);
   await session.send("Emulation.setDeviceMetricsOverride", { width: 2000, height: 1400, deviceScaleFactor: 1, mobile: false });
   await expect.poll(async () => (await box(picture)).width).toBe(2000);
   await session.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
   await expect.poll(async () => (await box(picture)).width).toBe(1280);
   await dialog.getByRole("button", { name: "Exit fullscreen" }).click();
   await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBeNull();
   await session.send("Emulation.clearDeviceMetricsOverride");
   await expect.poll(async () => (await box(picture)).width).toBeCloseTo(framing.width, 1);
   expect(await box(picture)).toEqual(framing);
   expect(
      await picture.evaluate((el) => [(el as HTMLVideoElement).currentTime, (el as HTMLVideoElement).paused, (el as HTMLVideoElement).volume]),
   ).toEqual([7, true, 0]);
   await dialog.getByRole("button", { name: "Close media viewer" }).click();
   await expect(dialog).toHaveCount(0);
});

test("real touch pinch and one-finger pan retain mobile controls and usable framing after rotation", async ({ page, context }) => {
   await page.setViewportSize({ width: 400, height: 800 });
   const session = await context.newCDPSession(page);
   await session.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 2 });
   const { dialog, picture } = await openMedia(page);
   const fitted = await box(picture);
   const touch = async (type: string, points: { x: number; y: number; id: number }[]) => {
      await session.send("Input.dispatchTouchEvent", { type, touchPoints: points });
   };
   await touch("touchStart", [
      { x: 150, y: 350, id: 1 },
      { x: 250, y: 350, id: 2 },
   ]);
   await touch("touchMove", [
      { x: 70, y: 350, id: 1 },
      { x: 330, y: 350, id: 2 },
   ]);
   await touch("touchEnd", []);
   await expect.poll(async () => (await box(picture)).width).toBeGreaterThan(fitted.width * 2);
   await expect(dialog.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
   const zoomed = await box(picture);
   await touch("touchStart", [{ x: 150, y: 350, id: 1 }]);
   await touch("touchMove", [{ x: 240, y: 350, id: 1 }]);
   await touch("touchEnd", []);
   expect((await box(picture)).x).toBeGreaterThan(zoomed.x + 50);
   await expect(dialog.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
   await page.setViewportSize({ width: 800, height: 400 });
   await expect.poll(async () => (await box(picture)).height).toBeLessThan(800);
   const rotated = await box(picture);
   expect(rotated.x).toBeLessThan(800);
   expect(rotated.x + rotated.width).toBeGreaterThan(0);
   // A deliberate tap still toggles controls after gestures.
   await touch("touchStart", [{ x: 350, y: 180, id: 1 }]);
   await touch("touchEnd", []);
   await expect(dialog.getByRole("button", { name: "Pause", exact: true })).toBeHidden();
   await expect(dialog).toBeVisible();
});
