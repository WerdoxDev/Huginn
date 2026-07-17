export const SCREEN_SHARE_QUALITIES = [
   { name: "Low", width: 854, height: 480, value: "low" },
   { name: "Medium", width: 1280, height: 720, value: "medium" },
   { name: "High", width: 1920, height: 1080, value: "high" },
   { name: "Ultra", width: 2560, height: 1440, value: "ultra" },
] as const;

export const SCREEN_SHARE_FRAME_RATES = [5, 15, 30, 60] as const;

export const AUDIO_QUALITIES = [
   { name: "Low", value: "low", bitrate: 16000 },
   { name: "Medium", value: "medium", bitrate: 64000 },
   { name: "High", value: "high", bitrate: 128000 },
   { name: "Ultra", value: "ultra", bitrate: 256000 },
] as const;
