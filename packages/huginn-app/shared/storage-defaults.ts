import { CONSTANTS } from "@huginnjs/shared";

import type { HostnamePreset, StorageMap } from "../src/types";

const env = typeof window === "undefined" ? process.env : import.meta.env;

const isDev = env.VITE_DEV_SERVER_URL;
const localApiHostname = env.VITE_PUBLIC_LOCAL_API_HOSTNAME;
const localCdnHostname = env.VITE_PUBLIC_LOCAL_CDN_HOSTNAME;
const localVoiceHostname = env.VITE_PUBLIC_LOCAL_VOICE_HOSTNAME;

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
         ...(isDev
            ? [
                 {
                    name: "Local",
                    hostnameSource: "manual",
                    apiHostname: localApiHostname ?? "https://midgard.huginn.dev",
                    cdnHostname: localCdnHostname ?? "https://midgard.huginn.dev",
                    voiceHostname: localVoiceHostname ?? "https://midgard.huginn.dev",
                    posthogHostname: "https://e.huginn.dev",
                    otelHostname: "https://otlp.huginn.dev",
                    externalHostnamesUrl: "",
                 } as HostnamePreset,
              ]
            : []),
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
      mediaVolume: 100,
      noiseSuppression: true,
      screenShareFramerate: "30",
      screenShareQuality: "medium",
      audioStreamQuality: "medium",
      screenShareAudio: false,
      screenShareSimulcast: true,
      screenShareAudioBitrate: CONSTANTS.DEFAULT_AUDIO_BITRATE,
      screenShareVideoBitrate: CONSTANTS.DEFAULT_VIDEO_BITRATE,
      useProxy: true,
      isVoiceDeafened: false,
      isVoiceMuted: false,
      isNotificationsEnabled: true,
   },
   keybinds: [
      { type: "toggle_deafen", combination: [], isEnabled: true },
      { type: "toggle_mute", combination: [], isEnabled: true },
   ],
   "client-info": { id: "" },
   "known-applications": { lastUpdated: "", applications: [] },
   "custom-applications": [],
   "pinned-channels": [],
};
