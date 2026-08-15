import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export type MediaDevicePermissionState = "granted" | "prompt" | "denied_once" | "denied";

export type MediaDevicePermission = {
   status: MediaDevicePermissionState;
   /** The Android permission dialog can no longer be shown; direct the user to app settings. */
   settingsRequired: boolean;
};

export type MediaDevicePermissionStatus = {
   microphone: MediaDevicePermission;
   camera: MediaDevicePermission;
};

export type MediaDevicePermissionRequest = {
   /** Defaults to true. */
   microphone?: boolean;
   /** Defaults to true. */
   camera?: boolean;
};

export type AndroidAudioRouteType = "earpiece" | "speaker" | "wired" | "bluetooth" | "usb" | "hearing_aid" | "hdmi" | "other";

export type AndroidAudioRoute = {
   /** Session-scoped Android AudioDeviceInfo ID. Do not persist this value. */
   id: string;
   name: string;
   type: AndroidAudioRouteType;
   active: boolean;
};

export type AndroidAudioRouteState = {
   routes: AndroidAudioRoute[];
   activeRouteId: string | null;
   /** Selected route, defaulting to the built-in speaker when available. */
   selectedRouteId: string | null;
   communicationStarted: boolean;
   /** False on Android 10–11, where routing is limited to coarse route categories. */
   supportsIndividualRoutes: boolean;
};

export type AndroidAudioRouteMutationResult = AndroidAudioRouteState & {
   accepted: boolean;
};

export type MediaDevicesPlugin = {
   getPermissionStatus(): Promise<MediaDevicePermissionStatus>;
   checkOrRequestPermissions(options?: MediaDevicePermissionRequest): Promise<MediaDevicePermissionStatus>;

   getAudioRoutes(): Promise<AndroidAudioRouteState>;
   startCommunication(): Promise<AndroidAudioRouteState>;
   stopCommunication(): Promise<AndroidAudioRouteMutationResult>;
   setAudioRoute(options: { routeId: string }): Promise<AndroidAudioRouteMutationResult>;

   addListener(eventName: "audioRoutesChanged", listener: (state: AndroidAudioRouteState) => void): Promise<PluginListenerHandle>;
   addListener(eventName: "audioRouteChanged", listener: (state: AndroidAudioRouteState) => void): Promise<PluginListenerHandle>;
};

export const NativeMediaDevices = registerPlugin<MediaDevicesPlugin>("MediaDevices", {});
