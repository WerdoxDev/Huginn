import type { StorageMap } from "../src/types";

export const storageDefaults: StorageMap = {
   settings: {
      apiHostname: "https://midgard.huginn.dev",
      cdnHostname: "https://midgard.huginn.dev",
      voiceHostname: "https://midgard.huginn.dev",
      analyticsHostname: "https://e.huginn.dev",
      hostnameSource: "manual",
      externalHostnamesUrl: "",
      theme: "pine green",
      inputDeviceId: "",
      outputDeviceId: "",
      cameraDeviceId: "",
      inputThreshold: -50,
      inputVolume: 100,
      outputVolume: 100,
      noiseSuppression: true,
      screenShareFramerate: 0,
      screenShareQuality: 0,
      screenShareAudio: false,
   },
   keybinds: [
      { type: "toggle_deafen", combination: [], isEnabled: true },
      { type: "toggle_mute", combination: [], isEnabled: true },
   ],
   "client-info": { id: "" },
   "voice-preferences": [],
   "known-applications": { lastUpdated: "", applications: [] },
   "custom-applications": [],
};
