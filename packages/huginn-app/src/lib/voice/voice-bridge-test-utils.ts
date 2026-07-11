import type { HMediaKind, Snowflake } from "@huginn/shared";

import type { AppSettings, VoicePreference } from "@/types";

export function makeSettings(overrides: Partial<AppSettings> = {}): AppSettings {
   return {
      hostnamePresets: [],
      activePresetName: "default",
      theme: "dark" as AppSettings["theme"],
      isChannelSidebarOpen: false,
      inputDeviceId: "input-device",
      outputDeviceId: "output-device",
      cameraDeviceId: "camera-device",
      inputVolume: 80,
      outputVolume: 70,
      inputThreshold: -50,
      noiseSuppression: true,
      screenShareFramerate: "30",
      screenShareQuality: "1080p",
      screenShareAudio: true,
      screenShareSimulcast: true,
      screenShareVideoBitrate: 2_000_000,
      screenShareAudioBitrate: 128_000,
      useProxy: false,
      ...overrides,
   };
}

export function makeVoicePreferences(preferences: VoicePreference[] = []): VoicePreference[] {
   return [...preferences];
}

export function makeTrack(kind: MediaStreamTrack["kind"] = "audio", id = `${kind}-track`): MediaStreamTrack {
   return {
      id,
      kind,
      enabled: true,
      muted: false,
      readyState: "live",
      label: `${kind}-label`,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
      stop: () => undefined,
      getSettings: () => ({}),
      clone: () => makeTrack(kind, `${id}-clone`),
      applyConstraints: async () => undefined,
   } as unknown as MediaStreamTrack;
}

export function makeStream(tracks: MediaStreamTrack[] = [makeTrack()]): MediaStream {
   const audioTracks = tracks.filter((track) => track.kind === "audio");
   const videoTracks = tracks.filter((track) => track.kind === "video");

   return {
      id: "media-stream",
      active: true,
      getTracks: () => [...tracks],
      getAudioTracks: () => [...audioTracks],
      getVideoTracks: () => [...videoTracks],
      addTrack: () => undefined,
      removeTrack: () => undefined,
      clone: () => makeStream([...tracks]),
      onaddtrack: null,
      onremovetrack: null,
   } as unknown as MediaStream;
}

export function makeRemoteProducer(options: { producerId: string; userId: Snowflake; kind: HMediaKind }): {
   producerId: string;
   userId: Snowflake;
   kind: HMediaKind;
} {
   return { ...options };
}

export function makeRemoteConsumer(options: { consumerId: string; producerId: string; userId: Snowflake; kind: HMediaKind }): {
   consumerId: string;
   producerId: string;
   userId: Snowflake;
   kind: HMediaKind;
} {
   return { ...options };
}

export function makeConsumer(options: { id: string; producerId: string; userId: Snowflake; kind: HMediaKind; track?: MediaStreamTrack }) {
   return {
      id: options.id,
      producerId: options.producerId,
      kind: options.kind,
      track: options.track ?? makeTrack(),
      appData: { userId: options.userId, mediaKind: options.kind },
      pause: () => undefined,
      getStats: async () => [],
   } as any;
}
