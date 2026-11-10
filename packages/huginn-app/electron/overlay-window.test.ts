/// <reference types="bun" />

import { afterEach, expect, mock, test } from "bun:test";

const loadURL = mock();
const loadFile = mock();
const setIgnoreMouseEvents = mock();
const createWindow = mock();
const originalDevServerUrl = process.env.VITE_DEV_SERVER_URL;

mock.module("electron", () => ({
   BrowserWindow: class {
      loadURL = loadURL;
      loadFile = loadFile;
      setIgnoreMouseEvents = setIgnoreMouseEvents;
      constructor(options: unknown) {
         createWindow(options);
      }
   },
}));

const { OverlayWindow } = await import("./overlay-window");

afterEach(() => {
   if (originalDevServerUrl === undefined) delete process.env.VITE_DEV_SERVER_URL;
   else process.env.VITE_DEV_SERVER_URL = originalDevServerUrl;
   mock.clearAllMocks();
});

test("passes the voice host ID in the development URL and keeps the overlay transparent and passive", () => {
   process.env.VITE_DEV_SERVER_URL = "http://localhost:5174";
   new OverlayWindow("main-host");

   expect(loadURL).toHaveBeenCalledWith("http://localhost:5174/app/?hostId=main-host#/overlay");
   expect(createWindow).toHaveBeenCalledWith(
      expect.objectContaining({
         transparent: true,
         focusable: false,
         webPreferences: expect.objectContaining({ sandbox: false, preload: expect.stringContaining("preload.mjs"), backgroundThrottling: false }),
      }),
   );
   expect(setIgnoreMouseEvents).toHaveBeenCalledWith(true);
});

test("passes the voice host ID as a query parameter in packaged builds", () => {
   delete process.env.VITE_DEV_SERVER_URL;
   new OverlayWindow("main-host");

   expect(loadFile).toHaveBeenCalledWith(expect.stringContaining("dist/index.html"), { hash: "/overlay", query: { hostId: "main-host" } });
});
