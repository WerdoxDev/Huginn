import { CONSTANTS } from "@huginnjs/shared";

import type { StorageMap } from "../src/types";

const env = typeof window === "undefined" ? process.env : import.meta.env;

const isDev = env.VITE_DEV_SERVER_URL;
const localApiHostname = env.VITE_PUBLIC_LOCAL_API_HOSTNAME;
const localCdnHostname = env.VITE_PUBLIC_LOCAL_CDN_HOSTNAME;
const localVoiceHostname = env.VITE_PUBLIC_LOCAL_VOICE_HOSTNAME;

export const storageDefaults: StorageMap = {
   settings: {
      currentInstanceId: "default",
      currentAccessAddress: "https://midgard.huginn.dev",
      currentUrls: {
         api: "https://midgard.huginn.dev/api",
         gateway: "wss://midgard.huginn.dev/gateway",
         cdn: "https://midgard.huginn.dev/cdn",
         voice: "wss://midgard.huginn.dev/voice",
         posthog: "https://e.huginn.dev",
         otlp: "https://otlp.huginn.dev",
      },
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
   instances: [
      { id: "default", name: "Default", accessAddresses: ["https://midgard.huginn.dev"] },
      ...(isDev
         ? [
              {
                 id: "local",
                 name: "Local",
                 accessAddresses: [localApiHostname ?? "http://localhost:3004"],
                 endpointOverrides: {
                    [localApiHostname ?? "http://localhost:3004"]: {
                       api: `${localApiHostname ?? "http://localhost:3004"}/api`,
                       gateway: `${(localApiHostname ?? "http://localhost:3004").replace(/^http/, "ws")}/gateway`,
                       cdn: `${localCdnHostname ?? "http://localhost:3002"}/cdn`,
                       voice: `${(localVoiceHostname ?? "http://localhost:3003").replace(/^http/, "ws")}/voice`,
                    },
                 },
              },
           ]
         : []),
   ],
   keybinds: [
      { type: "toggle_deafen", combination: [], isEnabled: true },
      { type: "toggle_mute", combination: [], isEnabled: true },
   ],
   "client-info": { id: "" },
   "application-catalog": {
      cursor: "0",
      full: true,
      games: [],
      matchers: [],
      deletedGameIds: [],
      deletedMatcherIds: [],
   },
   "custom-applications": [],
   "pinned-channels": [],
};
