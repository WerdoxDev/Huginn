import type { GatewayIdentifyProperties, ResponseLike, Snowflake } from "@huginnjs/shared";

import type { Voice } from "./voice";

export type ClientOptions<V extends Voice = Voice> = {
   rest?: Partial<RESTOptions>;
   cdn?: Partial<CDNOptions>;
   gateway?: Partial<GatewayOptions>;
   voice?: Partial<VoiceOptions<V>>;
};

export type RESTOptions = {
   api: string;
   authPrefix: "Bearer";
   makeRequest(url: string, init: RequestInit): Promise<ResponseLike>;
};

export type CDNOptions = {
   url: string;
};

export type GatewayOptions = {
   url: string;
   // TODO: Actually implement intents
   intents: number;
   properties: GatewayIdentifyProperties;
   createSocket(url: string): WebSocket;
};

export type VoiceConstructor<V extends Voice> = new (...args: ConstructorParameters<typeof Voice>) => V;

export type VoiceOptions<V extends Voice = Voice> = {
   class: VoiceConstructor<V>;
   url: string;
   createSocket(url: string): WebSocket;
};

export type VoiceSignallingResetType = "hard" | "soft" | "session";

export type VoiceConnectionData = {
   token: string;
   channelId: Snowflake;
   guildId: Snowflake | null;
};
export type VoiceStatus = "idle" | "connecting" | "signaling" | "disconnected" | "ready";

export type VoiceStreamOptions = {
   useSimulcast?: boolean;
   maxVideoBitrate?: number;
   maxAudioBitrate?: number;
};

export class TransportError extends Error {
   public code?: number;
   constructor(message: string, code?: number) {
      super(message);
      this.name = "TransportError";
      this.code = code;
   }
}
