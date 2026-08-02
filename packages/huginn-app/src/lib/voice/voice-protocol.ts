import type { VoiceStatus, VoiceStreamOptions } from "@huginnjs/api";
import type { Snowflake, VoicePreference } from "@huginnjs/shared";

import type { MediaSource, PopoutState } from "@/types";

export type VoiceHostSnapshot = {
   hostId: string;
   status: VoiceStatus;
   connection: {
      channelId: Snowflake;
      guildId: Snowflake | null;
   } | null;
   mediaSources: MediaSource[];
   popoutState: PopoutState;
};

export type VoiceStreamUpdate = {
   video?: { width?: number; height?: number; frameRate?: number; maxBitrate?: number };
   audio?: { maxBitrate?: number };
};

type VoiceProtocol = {
   get_snapshot: {
      data: undefined;
      result: VoiceHostSnapshot;
   };
   toggle_mute: {
      data: undefined;
      result: undefined;
   };
   toggle_deafen: {
      data: undefined;
      result: undefined;
   };
   connect_voice: {
      data: { guildId: Snowflake | null; channelId: Snowflake };
      result: undefined;
   };
   disconnect_voice: {
      data: undefined;
      result: undefined;
   };
   consume_stream: {
      data: { userId: Snowflake; guildId: Snowflake | null; channelId: Snowflake };
      result: undefined;
   };
   unconsume_stream: {
      data: { userId: Snowflake };
      result: undefined;
   };
   open_audio_stream: {
      data: { processId: number; maxAudioBitrate: number };
      result: undefined;
   };
   prepare_stream_replacement: {
      data: undefined;
      result: undefined;
   };
   update_stream: {
      data: VoiceStreamUpdate;
      result: undefined;
   };
   close_stream: {
      data: undefined;
      result: undefined;
   };
   close_camera: {
      data: undefined;
      result: undefined;
   };
   open_popout: {
      data: undefined;
      result: undefined;
   };
   open_media_popout: {
      data: MediaSource;
      result: undefined;
   };
   focus_media_popout: {
      data: string;
      result: undefined;
   };
   update_voice_preference: {
      data: Partial<VoicePreference> & { userId: Snowflake };
      result: VoicePreference[];
   };
};

export type VoiceMessages = {
   [K in keyof VoiceProtocol]: VoiceProtocol[K]["data"];
};

export type VoiceResults = {
   [K in keyof VoiceProtocol]: VoiceProtocol[K]["result"];
};

export type VoiceRequest = {
   [K in keyof VoiceProtocol]: {
      kind: "request";
      hostId: string;
      requestId: string;
      type: K;
      data: VoiceProtocol[K]["data"];
   };
}[keyof VoiceProtocol];

export type VoiceResult = {
   [K in keyof VoiceProtocol]:
      | {
           kind: "result";
           hostId: string;
           requestId: string;
           type: K;
           result: VoiceProtocol[K]["result"];
           error?: never;
        }
      | {
           kind: "result";
           hostId: string;
           requestId: string;
           type: K;
           result?: never;
           error: string;
        };
}[keyof VoiceProtocol];

export type VoiceEvents = {
   media_sources_updated: MediaSource[];
   popout_state_updated: PopoutState;
};

export type VoiceEvent = {
   [K in keyof VoiceEvents]: {
      kind: "event";
      hostId: string;
      type: K;
      data: VoiceEvents[K];
   };
}[keyof VoiceEvents];

export type VoiceMessage = VoiceRequest | VoiceResult | VoiceEvent;

export type CapturedStreamOptions = {
   type: "screen" | "application" | "device";
   stream: MediaStream;
   maxAudioBitrate: number;
   maxVideoBitrate: number;
   isAudioEnabled: boolean;
   isSimulcastEnabled: boolean;
   processId?: number;
};

export type VoiceWindowHost = {
   hostId: string;
   getTrack: (id?: string) => MediaStreamTrack | null;
   openCamera: (track: MediaStreamTrack) => Promise<void>;
   openCapturedStream: (options: CapturedStreamOptions) => Promise<void>;
   openStream: (videoTrack: MediaStreamTrack, audioTrack?: MediaStreamTrack, options?: VoiceStreamOptions) => Promise<void>;
};
