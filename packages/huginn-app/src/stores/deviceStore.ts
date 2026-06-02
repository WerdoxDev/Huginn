import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

import { storageStore } from "./storageStore";

const initialStore = () => ({
   outputDevices: [] as MediaDeviceInfo[],
   inputDevices: [] as MediaDeviceInfo[],
   cameraDevices: [] as MediaDeviceInfo[],
   unavailableInputDeviceId: undefined as string | undefined,
   unavailableOutputDeviceId: undefined as string | undefined,
   unavailableCameraDeviceId: undefined as string | undefined,
});

const store = createStore(
   combine(initialStore(), (set) => ({
      setUnavailableInputDevice: (deviceId: string | undefined) => set({ unavailableInputDeviceId: deviceId }),
      setUnavailableOutputDevice: (deviceId: string | undefined) => set({ unavailableOutputDeviceId: deviceId }),
      setUnavailableCameraDevice: (deviceId: string | undefined) => set({ unavailableCameraDeviceId: deviceId }),
   })),
);

export async function initDeviceStore() {
   if (!window.isSecureContext) return;

   await setDevices();
   checkDevices();

   const controller = new AbortController();
   navigator.mediaDevices.addEventListener(
      "devicechange",
      async () => {
         await setDevices();
         checkDevices();
      },
      { signal: controller.signal },
   );

   return () => {
      controller.abort();
   };
}

async function setDevices() {
   const devices = await navigator.mediaDevices.enumerateDevices();

   const outputDevices = devices.filter((x) => x.kind === "audiooutput");
   const inputDevices = devices.filter((x) => x.kind === "audioinput");
   const cameraDevices = devices.filter((x) => x.kind === "videoinput");

   store.setState({ cameraDevices, inputDevices, outputDevices });
}

function checkDevices() {
   const storage = storageStore.getState();
   const settings = storage.cache.settings;
   const thisStore = store.getState();

   // Input device recovery
   if (thisStore.unavailableInputDeviceId && thisStore.inputDevices.some((x) => x.deviceId === thisStore.unavailableInputDeviceId)) {
      storage.setCachedValue("settings", { ...settings, inputDeviceId: thisStore.unavailableInputDeviceId });
      thisStore.setUnavailableInputDevice(undefined);
   }
   if (!thisStore.unavailableInputDeviceId && !thisStore.inputDevices.some((x) => x.deviceId === settings.inputDeviceId)) {
      storage.setCachedValue("settings", { ...settings, inputDeviceId: thisStore.inputDevices[0]?.deviceId });
      thisStore.setUnavailableInputDevice(settings.inputDeviceId);
   }

   // Output device recovery
   if (thisStore.unavailableOutputDeviceId && thisStore.outputDevices.some((x) => x.deviceId === thisStore.unavailableOutputDeviceId)) {
      storage.setCachedValue("settings", { ...settings, outputDeviceId: thisStore.unavailableOutputDeviceId });
      thisStore.setUnavailableOutputDevice(undefined);
   }
   if (!thisStore.unavailableOutputDeviceId && !thisStore.outputDevices.some((x) => x.deviceId === settings.outputDeviceId)) {
      storage.setCachedValue("settings", { ...settings, outputDeviceId: thisStore.outputDevices[0]?.deviceId });
      thisStore.setUnavailableOutputDevice(settings.outputDeviceId);
   }

   // Camera device recovery
   if (thisStore.unavailableCameraDeviceId && thisStore.cameraDevices.some((x) => x.deviceId === thisStore.unavailableCameraDeviceId)) {
      storage.setCachedValue("settings", { ...settings, cameraDeviceId: thisStore.unavailableCameraDeviceId });
      thisStore.setUnavailableCameraDevice(undefined);
   }
   if (!thisStore.unavailableCameraDeviceId && !thisStore.cameraDevices.some((x) => x.deviceId === settings.cameraDeviceId)) {
      storage.setCachedValue("settings", { ...settings, cameraDeviceId: thisStore.cameraDevices[0]?.deviceId });
      thisStore.setUnavailableCameraDevice(settings.cameraDeviceId);
   }
}

export function useDevice() {
   return useStore(store);
}
