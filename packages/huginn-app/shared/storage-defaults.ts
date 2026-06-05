import { CONSTANTS } from "@huginn/shared";

import type { StorageMap } from "../src/types";

export const storageDefaults: StorageMap = {
   settings: {
      hostnamePresets: [
         {
            name: "Default",
            hostnameSource: "manual",
            apiHostname: "https://midgard.huginn.dev",
            cdnHostname: "https://midgard.huginn.dev",
            voiceHostname: "https://midgard.huginn.dev",
            posthogHostname: "https://e.huginn.dev",
            otelHostname: "https://otlp.huginn.dev",
            externalHostnamesUrl: "",
         },
      ],
      activePresetName: "Default",
      theme: "pine-green",
      isChannelSidebarOpen: true,
      inputDeviceId: "",
      outputDeviceId: "",
      cameraDeviceId: "",
      inputThreshold: -50,
      inputVolume: 100,
      outputVolume: 100,
      noiseSuppression: true,
      screenShareFramerate: "30",
      screenShareQuality: "medium",
      screenShareAudio: false,
      screenShareSimulcast: true,
      screenShareAudioBitrate: CONSTANTS.DEFAULT_AUDIO_BITRATE,
      screenShareVideoBitrate: CONSTANTS.DEFAULT_VIDEO_BITRATE,
   },
   keybinds: [
      { type: "toggle_deafen", combination: [], isEnabled: true },
      { type: "toggle_mute", combination: [], isEnabled: true },
   ],
   "client-info": { id: "" },
   "voice-preferences": [],
   "known-applications": { lastUpdated: "", applications: [] },
   "custom-applications": [],
   "pinned-channels": [],
};
