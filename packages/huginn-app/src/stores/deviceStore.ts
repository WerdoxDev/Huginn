import { analytics, recordSpanError } from "@huginnjs/shared";
import { createStore, useStore } from "zustand";

import type { AppSettings } from "@/types";

import { storageStore } from "./storageStore";

type DeviceType = "input" | "output" | "camera";

type DeviceSelection = {
   selectedDeviceId: string;
   unavailableDeviceId: string | undefined;
   temporaryDeviceId: string | undefined;
   needsPermanentDevice: boolean;
};

type DeviceResolution = DeviceSelection & {
   isRestored: boolean;
   isUnavailable: boolean;
   shouldPersist: boolean;
};

const initialStore = () => ({
   outputDevices: [] as MediaDeviceInfo[],
   inputDevices: [] as MediaDeviceInfo[],
   cameraDevices: [] as MediaDeviceInfo[],
   unavailableInputDeviceId: undefined as string | undefined,
   unavailableOutputDeviceId: undefined as string | undefined,
   unavailableCameraDeviceId: undefined as string | undefined,
   temporaryInputDeviceId: undefined as string | undefined,
   temporaryOutputDeviceId: undefined as string | undefined,
   temporaryCameraDeviceId: undefined as string | undefined,
   needsPermanentInputDevice: false,
   needsPermanentOutputDevice: false,
   needsPermanentCameraDevice: false,
   hasCompletedInitialRefresh: false,
});

const store = createStore(initialStore);
let refreshQueue = Promise.resolve();

export async function initDeviceStore() {
   if (!window.isSecureContext) return;

   await refreshDevices();

   const controller = new AbortController();
   navigator.mediaDevices.addEventListener(
      "devicechange",
      () => {
         void refreshDevices();
      },
      { signal: controller.signal },
   );

   return () => {
      controller.abort();
   };
}

export function refreshDevices() {
   const refresh = refreshQueue.then(async () => {
      if (!(await setDevices())) return;

      const isInitialRefresh = !store.getState().hasCompletedInitialRefresh;
      await checkDevices(isInitialRefresh);
      if (isInitialRefresh) store.setState({ hasCompletedInitialRefresh: true });
   });

   refreshQueue = refresh.catch(() => undefined);
   return refresh;
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
         return true;
      } catch (e) {
         recordSpanError(e);
         return false;
      } finally {
         span.end();
      }
   });
}

async function checkDevices(isInitialRefresh: boolean) {
   return analytics.startActiveSpan("deviceStore.checkDevices", async (span) => {
      try {
         const storage = storageStore.getState();
         const settings = storage.cache.settings;
         const thisStore = store.getState();

         const input = resolveDevice(
            thisStore.inputDevices,
            {
               selectedDeviceId: settings.inputDeviceId,
               unavailableDeviceId: thisStore.unavailableInputDeviceId,
               temporaryDeviceId: thisStore.temporaryInputDeviceId,
               needsPermanentDevice: thisStore.needsPermanentInputDevice,
            },
            isInitialRefresh,
         );
         const output = resolveDevice(
            thisStore.outputDevices,
            {
               selectedDeviceId: settings.outputDeviceId,
               unavailableDeviceId: thisStore.unavailableOutputDeviceId,
               temporaryDeviceId: thisStore.temporaryOutputDeviceId,
               needsPermanentDevice: thisStore.needsPermanentOutputDevice,
            },
            isInitialRefresh,
         );
         const camera = resolveDevice(
            thisStore.cameraDevices,
            {
               selectedDeviceId: settings.cameraDeviceId,
               unavailableDeviceId: thisStore.unavailableCameraDeviceId,
               temporaryDeviceId: thisStore.temporaryCameraDeviceId,
               needsPermanentDevice: thisStore.needsPermanentCameraDevice,
            },
            isInitialRefresh,
         );

         const nextSettings: AppSettings = {
            ...settings,
            inputDeviceId: input.selectedDeviceId,
            outputDeviceId: output.selectedDeviceId,
            cameraDeviceId: camera.selectedDeviceId,
         };

         store.setState({
            unavailableInputDeviceId: input.unavailableDeviceId,
            unavailableOutputDeviceId: output.unavailableDeviceId,
            unavailableCameraDeviceId: camera.unavailableDeviceId,
            temporaryInputDeviceId: input.temporaryDeviceId,
            temporaryOutputDeviceId: output.temporaryDeviceId,
            temporaryCameraDeviceId: camera.temporaryDeviceId,
            needsPermanentInputDevice: input.needsPermanentDevice,
            needsPermanentOutputDevice: output.needsPermanentDevice,
            needsPermanentCameraDevice: camera.needsPermanentDevice,
         });

         const settingsChanged =
            nextSettings.inputDeviceId !== settings.inputDeviceId ||
            nextSettings.outputDeviceId !== settings.outputDeviceId ||
            nextSettings.cameraDeviceId !== settings.cameraDeviceId;
         if (settingsChanged) storage.setCachedValue("settings", nextSettings);

         if (input.shouldPersist || output.shouldPersist || camera.shouldPersist) {
            const persistedSettings: AppSettings = {
               ...nextSettings,
               inputDeviceId: input.unavailableDeviceId ?? nextSettings.inputDeviceId,
               outputDeviceId: output.unavailableDeviceId ?? nextSettings.outputDeviceId,
               cameraDeviceId: camera.unavailableDeviceId ?? nextSettings.cameraDeviceId,
            };
            await storage.storage.saveFile("settings", persistedSettings);
         }

         span.setAttributes({
            "devices.initial_refresh": isInitialRefresh,
            "devices.input.id": nextSettings.inputDeviceId,
            "devices.output.id": nextSettings.outputDeviceId,
            "devices.camera.id": nextSettings.cameraDeviceId,
            "devices.input.unavailable_id": input.unavailableDeviceId ?? "",
            "devices.output.unavailable_id": output.unavailableDeviceId ?? "",
            "devices.camera.unavailable_id": camera.unavailableDeviceId ?? "",
            "devices.input.is_unavailable": input.isUnavailable,
            "devices.output.is_unavailable": output.isUnavailable,
            "devices.camera.is_unavailable": camera.isUnavailable,
            "devices.input.is_restored": input.isRestored,
            "devices.output.is_restored": output.isRestored,
            "devices.camera.is_restored": camera.isRestored,
         });
      } catch (e) {
         recordSpanError(e);
      } finally {
         span.end();
      }
   });
}

function resolveDevice(devices: MediaDeviceInfo[], selection: DeviceSelection, isInitialRefresh: boolean): DeviceResolution {
   const firstAvailableDeviceId = devices[0]?.deviceId;
   const isAvailable = (deviceId: string | undefined) => !!deviceId && devices.some((device) => device.deviceId === deviceId);

   if (isInitialRefresh) {
      if (isAvailable(selection.selectedDeviceId)) {
         return resolved(selection.selectedDeviceId, undefined, undefined, false);
      }

      if (firstAvailableDeviceId) {
         return resolved(firstAvailableDeviceId, undefined, undefined, false, {
            isUnavailable: !!selection.selectedDeviceId,
            shouldPersist: true,
         });
      }

      return resolved(selection.selectedDeviceId, undefined, undefined, true, {
         isUnavailable: !!selection.selectedDeviceId,
      });
   }

   let unavailableDeviceId = selection.unavailableDeviceId;
   let temporaryDeviceId = selection.temporaryDeviceId;

   // A settings change away from our automatic fallback is an explicit choice.
   if (unavailableDeviceId && temporaryDeviceId && selection.selectedDeviceId !== temporaryDeviceId) {
      unavailableDeviceId = undefined;
      temporaryDeviceId = undefined;
   }

   if (selection.needsPermanentDevice || !selection.selectedDeviceId) {
      if (isAvailable(selection.selectedDeviceId)) {
         return resolved(selection.selectedDeviceId, undefined, undefined, false);
      }

      if (firstAvailableDeviceId) {
         return resolved(firstAvailableDeviceId, undefined, undefined, false, {
            isUnavailable: !!selection.selectedDeviceId,
            shouldPersist: true,
         });
      }

      return resolved(selection.selectedDeviceId, undefined, undefined, true, {
         isUnavailable: !!selection.selectedDeviceId,
      });
   }

   if (unavailableDeviceId) {
      if (isAvailable(unavailableDeviceId)) {
         return resolved(unavailableDeviceId, undefined, undefined, false, { isRestored: true });
      }

      if (isAvailable(selection.selectedDeviceId)) {
         return resolved(selection.selectedDeviceId, unavailableDeviceId, temporaryDeviceId, false, { isUnavailable: true });
      }

      if (firstAvailableDeviceId) {
         return resolved(firstAvailableDeviceId, unavailableDeviceId, firstAvailableDeviceId, false, { isUnavailable: true });
      }

      return resolved(selection.selectedDeviceId, unavailableDeviceId, temporaryDeviceId, false, { isUnavailable: true });
   }

   if (isAvailable(selection.selectedDeviceId)) {
      return resolved(selection.selectedDeviceId, undefined, undefined, false);
   }

   if (firstAvailableDeviceId) {
      return resolved(firstAvailableDeviceId, selection.selectedDeviceId, firstAvailableDeviceId, false, { isUnavailable: true });
   }

   return resolved(selection.selectedDeviceId, undefined, undefined, false, { isUnavailable: true });
}

function resolved(
   selectedDeviceId: string,
   unavailableDeviceId: string | undefined,
   temporaryDeviceId: string | undefined,
   needsPermanentDevice: boolean,
   flags: Partial<Pick<DeviceResolution, "isRestored" | "isUnavailable" | "shouldPersist">> = {},
): DeviceResolution {
   return {
      selectedDeviceId,
      unavailableDeviceId,
      temporaryDeviceId,
      needsPermanentDevice,
      isRestored: flags.isRestored ?? false,
      isUnavailable: flags.isUnavailable ?? false,
      shouldPersist: flags.shouldPersist ?? false,
   };
}

export function clearTemporaryDevice(type: DeviceType) {
   if (type === "input") {
      store.setState({ unavailableInputDeviceId: undefined, temporaryInputDeviceId: undefined, needsPermanentInputDevice: false });
   } else if (type === "output") {
      store.setState({ unavailableOutputDeviceId: undefined, temporaryOutputDeviceId: undefined, needsPermanentOutputDevice: false });
   } else {
      store.setState({ unavailableCameraDeviceId: undefined, temporaryCameraDeviceId: undefined, needsPermanentCameraDevice: false });
   }
}

export function useDevice() {
   return useStore(store);
}

export const deviceStore = store;
