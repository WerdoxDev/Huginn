import { analytics, recordSpanError } from "@huginnjs/shared";
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
   return analytics.startActiveSpan("deviceStore.setDevices", async (span) => {
      try {
         const devices = await navigator.mediaDevices.enumerateDevices();

         const outputDevices = devices.filter((x) => x.kind === "audiooutput");
         const inputDevices = devices.filter((x) => x.kind === "audioinput");
         const cameraDevices = devices.filter((x) => x.kind === "videoinput");

         span.setAttributes({
            "devices.count": devices.length,
            "devices.output.count": outputDevices.length,
            "devices.input.count": inputDevices.length,
            "devices.camera.count": cameraDevices.length,
         });

         store.setState({ cameraDevices, inputDevices, outputDevices });
      } catch (e) {
         recordSpanError(e);
      } finally {
         span.end();
      }
   });
}

function checkDevices() {
   analytics.startActiveSpan("deviceStore.checkDevices", (span) => {
      try {
         const storage = storageStore.getState();
         const settings = storage.cache.settings;
         const thisStore = store.getState();

         const isInputDeviceRestored =
            thisStore.unavailableInputDeviceId && thisStore.inputDevices.some((x) => x.deviceId === thisStore.unavailableInputDeviceId);
         const isOutputDeviceRestored =
            thisStore.unavailableOutputDeviceId && thisStore.outputDevices.some((x) => x.deviceId === thisStore.unavailableOutputDeviceId);
         const isCameraDeviceRestored =
            thisStore.unavailableCameraDeviceId && thisStore.cameraDevices.some((x) => x.deviceId === thisStore.unavailableCameraDeviceId);

         const isInputDeviceUnavailable =
            !thisStore.unavailableInputDeviceId && !thisStore.inputDevices.some((x) => x.deviceId === settings.inputDeviceId);
         const isOutputDeviceUnavailable =
            !thisStore.unavailableOutputDeviceId && !thisStore.outputDevices.some((x) => x.deviceId === settings.outputDeviceId);
         const isCameraDeviceUnavailable =
            !thisStore.unavailableCameraDeviceId && !thisStore.cameraDevices.some((x) => x.deviceId === settings.cameraDeviceId);

         span.setAttributes({
            "devices.input.id": settings.inputDeviceId,
            "devices.output.id": settings.outputDeviceId,
            "devices.camera.id": settings.cameraDeviceId,

            "devices.input.unavailable_id": thisStore.unavailableInputDeviceId,
            "devices.output.unavailable_id": thisStore.unavailableOutputDeviceId,
            "devices.camera.unavailable_id": thisStore.unavailableCameraDeviceId,

            "devices.input.is_unavailable": isInputDeviceUnavailable,
            "devices.output.is_unavailable": isOutputDeviceUnavailable,
            "devices.camera.is_unavailable": isCameraDeviceUnavailable,

            "devices.input.is_restored": isInputDeviceRestored,
            "devices.output.is_restored": isOutputDeviceRestored,
            "devices.camera.is_restored": isCameraDeviceRestored,
         });

         // device recovery
         if (isInputDeviceRestored) {
            storage.setCachedValue("settings", { ...settings, inputDeviceId: thisStore.unavailableInputDeviceId! });
            thisStore.setUnavailableInputDevice(undefined);
         }
         // temporary device
         if (isInputDeviceUnavailable) {
            storage.setCachedValue("settings", { ...settings, inputDeviceId: thisStore.inputDevices[0]?.deviceId });
            thisStore.setUnavailableInputDevice(settings.inputDeviceId);
         }

         if (isOutputDeviceRestored) {
            storage.setCachedValue("settings", { ...settings, outputDeviceId: thisStore.unavailableOutputDeviceId! });
            thisStore.setUnavailableOutputDevice(undefined);
         }
         if (isOutputDeviceUnavailable) {
            storage.setCachedValue("settings", { ...settings, outputDeviceId: thisStore.outputDevices[0]?.deviceId });
            thisStore.setUnavailableOutputDevice(settings.outputDeviceId);
         }

         if (isCameraDeviceRestored) {
            storage.setCachedValue("settings", { ...settings, cameraDeviceId: thisStore.unavailableCameraDeviceId! });
            thisStore.setUnavailableCameraDevice(undefined);
         }
         if (isCameraDeviceUnavailable) {
            storage.setCachedValue("settings", { ...settings, cameraDeviceId: thisStore.cameraDevices[0]?.deviceId });
            thisStore.setUnavailableCameraDevice(settings.cameraDeviceId);
         }
      } catch (e) {
         recordSpanError(e);
      } finally {
         span.end();
      }
   });
}

export function useDevice() {
   return useStore(store);
}
