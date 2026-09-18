import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppSettings } from "@/types";

import { clearTemporaryDevice, deviceStore, refreshDevices } from "./deviceStore";
import { storageStore } from "./storageStore";

let availableDevices: MediaDeviceInfo[];

function mediaDevice(kind: MediaDeviceKind, deviceId: string): MediaDeviceInfo {
   return {
      kind,
      deviceId,
      groupId: `${deviceId}-group`,
      label: deviceId,
      toJSON: () => ({}),
   };
}

function devices(input: string[], output: string[], camera: string[]) {
   return [
      ...input.map((id) => mediaDevice("audioinput", id)),
      ...output.map((id) => mediaDevice("audiooutput", id)),
      ...camera.map((id) => mediaDevice("videoinput", id)),
   ];
}

async function setSettings(update: Partial<AppSettings>) {
   const storage = storageStore.getState();
   const settings = { ...storage.cache.settings, ...update };
   await storage.storage.saveFile("settings", settings);
   storage.setCachedValue("settings", settings);
}

async function getPersistedSettings() {
   return (await storageStore.getState().storage.loadFile("settings")).data;
}

function currentDeviceIds() {
   const settings = storageStore.getState().cache.settings;
   return {
      inputDeviceId: settings.inputDeviceId,
      outputDeviceId: settings.outputDeviceId,
      cameraDeviceId: settings.cameraDeviceId,
   };
}

describe("deviceStore", () => {
   beforeEach(() => {
      availableDevices = [];
      Object.defineProperty(navigator, "mediaDevices", {
         configurable: true,
         value: {
            addEventListener: vi.fn(),
            enumerateDevices: vi.fn(async () => availableDevices),
         },
      });

      deviceStore.setState({
         outputDevices: [],
         inputDevices: [],
         cameraDevices: [],
         unavailableInputDeviceId: undefined,
         unavailableOutputDeviceId: undefined,
         unavailableCameraDeviceId: undefined,
         temporaryInputDeviceId: undefined,
         temporaryOutputDeviceId: undefined,
         temporaryCameraDeviceId: undefined,
         needsPermanentInputDevice: false,
         needsPermanentOutputDevice: false,
         needsPermanentCameraDevice: false,
         hasCompletedInitialRefresh: false,
      });
   });

   it("selects and persists all missing device settings during the initial refresh", async () => {
      await setSettings({ inputDeviceId: "", outputDeviceId: "", cameraDeviceId: "" });
      availableDevices = devices(["input-a"], ["output-a"], ["camera-a"]);

      await refreshDevices();

      const expected = { inputDeviceId: "input-a", outputDeviceId: "output-a", cameraDeviceId: "camera-a" };
      expect(currentDeviceIds()).toEqual(expected);
      expect(await getPersistedSettings()).toMatchObject(expected);
   });

   it("permanently replaces devices that are unavailable during the initial refresh", async () => {
      await setSettings({ inputDeviceId: "input-old", outputDeviceId: "output-old", cameraDeviceId: "camera-old" });
      availableDevices = devices(["input-new"], ["output-new"], ["camera-new"]);

      await refreshDevices();

      const expected = { inputDeviceId: "input-new", outputDeviceId: "output-new", cameraDeviceId: "camera-new" };
      expect(currentDeviceIds()).toEqual(expected);
      expect(await getPersistedSettings()).toMatchObject(expected);

      availableDevices = devices(["input-old", "input-new"], ["output-old", "output-new"], ["camera-old", "camera-new"]);
      await refreshDevices();

      expect(currentDeviceIds()).toEqual(expected);
   });

   it("temporarily replaces simultaneous disconnects, follows further fallback changes, and restores preferences", async () => {
      const preferred = { inputDeviceId: "input-a", outputDeviceId: "output-a", cameraDeviceId: "camera-a" };
      await setSettings(preferred);
      availableDevices = devices(["input-a"], ["output-a"], ["camera-a"]);
      await refreshDevices();

      availableDevices = devices(["input-b"], ["output-b"], ["camera-b"]);
      await refreshDevices();

      expect(currentDeviceIds()).toEqual({ inputDeviceId: "input-b", outputDeviceId: "output-b", cameraDeviceId: "camera-b" });
      expect(await getPersistedSettings()).toMatchObject(preferred);

      availableDevices = devices(["input-c"], ["output-c"], ["camera-c"]);
      await refreshDevices();

      expect(currentDeviceIds()).toEqual({ inputDeviceId: "input-c", outputDeviceId: "output-c", cameraDeviceId: "camera-c" });
      expect(await getPersistedSettings()).toMatchObject(preferred);

      availableDevices = devices(["input-a", "input-c"], ["output-a", "output-c"], ["camera-a", "camera-c"]);
      await refreshDevices();

      expect(currentDeviceIds()).toEqual(preferred);
      expect(deviceStore.getState()).toMatchObject({
         unavailableInputDeviceId: undefined,
         unavailableOutputDeviceId: undefined,
         unavailableCameraDeviceId: undefined,
      });
   });

   it("keeps an explicit selection instead of restoring a formerly unavailable device", async () => {
      await setSettings({ inputDeviceId: "input-a" });
      availableDevices = devices(["input-a"], [], []);
      await refreshDevices();

      availableDevices = devices(["input-b"], [], []);
      await refreshDevices();
      expect(currentDeviceIds().inputDeviceId).toBe("input-b");

      clearTemporaryDevice("input");
      await setSettings({ inputDeviceId: "input-b" });
      availableDevices = devices(["input-a", "input-b"], [], []);
      await refreshDevices();

      expect(currentDeviceIds().inputDeviceId).toBe("input-b");
      expect((await getPersistedSettings()).inputDeviceId).toBe("input-b");
   });

   it("persists a delayed first choice without persisting another device's temporary fallback", async () => {
      await setSettings({ inputDeviceId: "input-old", outputDeviceId: "output-a", cameraDeviceId: "camera-a" });
      availableDevices = devices([], ["output-a"], ["camera-a"]);
      await refreshDevices();

      availableDevices = devices(["input-new"], ["output-b"], ["camera-a"]);
      await refreshDevices();

      expect(currentDeviceIds()).toEqual({ inputDeviceId: "input-new", outputDeviceId: "output-b", cameraDeviceId: "camera-a" });
      expect(await getPersistedSettings()).toMatchObject({
         inputDeviceId: "input-new",
         outputDeviceId: "output-a",
         cameraDeviceId: "camera-a",
      });
   });
});
