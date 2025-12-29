export const screenShareQualities = [
   { name: "Low", width: 854, height: 480, value: "low" },
   { name: "Medium", width: 1280, height: 720, value: "medium" },
   { name: "High", width: 1920, height: 1080, value: "high" },
   { name: "Ultra", width: 2560, height: 1440, value: "ultra" },
] as const;

export const screenShareFrameRates = [5, 15, 30, 60] as const;
