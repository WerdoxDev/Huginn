import { afterEach, expect, test, vi } from "vitest";

const originalUrl = window.location.href;
const originalOpener = window.opener;

afterEach(() => {
   window.history.replaceState(null, "", originalUrl);
   window.opener = originalOpener;
   vi.resetModules();
});

test("an Electron overlay uses its host ID without a browser opener", async () => {
   window.history.replaceState(null, "", "/?hostId=main-voice-host#/overlay");
   window.opener = null;
   vi.resetModules();
   const { getHostId, isChildWindow } = await import("./child-window");

   expect(isChildWindow()).toBe(true);
   expect(getHostId()).toBe("main-voice-host");
});

test("a main window creates its own host ID", async () => {
   window.history.replaceState(null, "", "/");
   window.opener = null;
   vi.resetModules();
   const { getHostId, isChildWindow } = await import("./child-window");

   expect(isChildWindow()).toBe(false);
   expect(getHostId()).toBeTruthy();
});
