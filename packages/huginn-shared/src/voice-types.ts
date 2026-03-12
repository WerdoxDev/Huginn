import type { types } from "mediasoup";
import type { DtlsParameters, IceCandidate, IceParameters, ProducerType, RtpCapabilities, RtpParameters } from "mediasoup/types";

import type { Snowflake } from "./snowflake";

export enum VoiceOperations {
   HELLO = 0,
   IDENTIFY = 1,
   HEARTBEAT = 2,
   HEARTBEAT_ACK = 3,
   DISPATCH = 4,
   PING = 5,
   PONG = 6,
   RESUME = 7,
}

export type VoiceOperationTypes = {
   [VoiceOperations.HELLO]: VoiceHello;
   [VoiceOperations.IDENTIFY]: VoiceIdentify;
   [VoiceOperations.HEARTBEAT]: VoiceHeartbeat;
   [VoiceOperations.HEARTBEAT_ACK]: VoiceHeartbeatAck;
   [VoiceOperations.DISPATCH]: VoiceDispatch;
   [VoiceOperations.PING]: VoicePing;
   [VoiceOperations.PONG]: VoicePong;
   [VoiceOperations.RESUME]: VoiceResume;
};

export type VoiceEvents = {
   send_transport_ready: { channelId: Snowflake };
   recv_transport_ready: { channelId: Snowflake };
   local_consumer_created: {
      consumerId: string;
      producerId: string;
      track: MediaStreamTrack;
      producerUserId: Snowflake;
      kind: HMediaKind;
   };
   local_producer_created: { producerId: string; kind: HMediaKind; track: MediaStreamTrack };
   local_producer_changed: { producerId: string; kind: HMediaKind; track: MediaStreamTrack | null };
   local_voice_state_changed: LocalVoiceState;
};

export type VoiceWebsocketEvents = {
   hello: VoiceHelloData;
   identify: VoiceIdentifyData;
   ready: VoiceReadyData;
   resumed: undefined;

   create_transport: VoiceCreateTransportData;
   create_transport_result: VoiceCreateTransportResult;

   connect_transport: VoiceConnectTransportData;
   connect_transport_result: VoiceConnectTransportResult;
   restart_ice: VoiceRestartIceData;
   restart_ice_result: VoiceRestartIceResult;

   produce: VoiceProduceData;
   produce_result: VoiceProduceResult;

   producer_created: VoiceProducerCreatedData;
   producer_closed: VoiceProducerClosedData;

   close_producer: VoiceCloseProducerData;
   close_producer_result: VoiceCloseProducerResult;

   consume: VoiceConsumeData;
   consume_result: VoiceConsumeResult;

   resume_consumer: VoiceResumeConsumerData;
   resume_consumer_result: VoiceResumeConsumerResult;

   close_consumer: VoiceCloseConsumerData;
   close_consumer_result: VoiceCloseConsumerResult;

   consumer_created: VoiceConsumerCreatedData;
   consumer_closed: VoiceConsumerClosedData;

   peer_left: VoicePeerLeftData;
};

export type VoicePayload<Event extends keyof VoiceWebsocketEvents | undefined = undefined> = Event extends undefined
   ? {
        [K in keyof VoiceOperationTypes]: VoiceOperationTypes[K]["op"] extends VoiceOperations.DISPATCH
           ? VoiceDispatch
           : {
                op: K;
             } & ("d" extends keyof VoiceOperationTypes[K] ? { d: VoiceOperationTypes[K]["d"] } : {}) &
                ("s" extends keyof VoiceOperationTypes[K] ? { s?: number } : {}) &
                ("t" extends keyof VoiceOperationTypes[K] ? { t: string } : {});
     }[keyof VoiceOperationTypes]
   : {
        op: VoiceOperations.DISPATCH;
        s?: number;
        d: VoiceWebsocketEvents[Extract<Event, keyof VoiceWebsocketEvents>];
        t: Event;
     };

export type VoiceDispatch = {
   [K in keyof VoiceWebsocketEvents]: {
      op: VoiceOperations.DISPATCH;
      s?: number;
      t: K;
      d: VoiceWebsocketEvents[K];
   };
}[keyof VoiceWebsocketEvents];

export type MediasoupAppData = { mediaKind: HMediaKind; userId: Snowflake };

export type HMediaKind = "microphone" | "stream_audio" | "stream_video" | "camera" | "unknown";

export type VoiceError = { error: number; nonce?: Snowflake };
// type OkStatus = { status: "ok" };

export type ProducerData = {
   producerId: string;
   userId: Snowflake;
   kind: HMediaKind;
};

export type ConsumerData = {
   consumerId: string;
   producerId: string;
   userId: Snowflake;
   kind: HMediaKind;
};

export type VoiceHeartbeat = {
   op: VoiceOperations.HEARTBEAT;
   d: VoiceHeartbeatData;
};

export type VoiceHeartbeatData = number | undefined;

export type VoiceHeartbeatAck = {
   op: VoiceOperations.HEARTBEAT_ACK;
};

export type VoiceHello = {
   op: VoiceOperations.HELLO;
   d: VoiceHelloData;
};

export type VoiceHelloData = {
   heartbeatInterval: number;
   sessionId: Snowflake;
};

export type VoiceIdentify = {
   op: VoiceOperations.IDENTIFY;
   d: VoiceIdentifyData;
};

export type VoiceIdentifyData = {
   token: string;
   channelId: Snowflake;
   guildId: Snowflake | null;
};

export type VoicePing = {
   op: VoiceOperations.PING;
};

export type VoicePong = {
   op: VoiceOperations.PONG;
};

export type VoiceReadyData = {
   rtpCapabilities: types.RtpCapabilities;
   producers: ProducerData[];
   consumers: ConsumerData[];
};

export type VoiceResume = {
   op: VoiceOperations.RESUME;
   d: VoiceResumeData;
};

export type VoiceResumeData = {
   token: string;
   sessionId: Snowflake;
   seq: number;
};

export type VoiceCreateTransportData = {
   channelId: Snowflake;
   direction: "send" | "recv";
   nonce?: Snowflake;
};

export type VoiceCreateTransportResult = VoiceError | VoiceCreateTransportResultData;
export type VoiceCreateTransportResultData = {
   nonce?: Snowflake;
   direction: "send" | "recv";
   transportId: string;
   params: {
      id: string;
      iceParameters: IceParameters;
      iceCandidates: IceCandidate[];
      dtlsParameters: DtlsParameters;
   };
};

export type VoiceConnectTransportData = {
   channelId: Snowflake;
   transportId: string;
   dtlsParameters: DtlsParameters;
   nonce?: Snowflake;
};

export type VoiceConnectTransportResult = VoiceError | VoiceConnectTransportResultData;
export type VoiceConnectTransportResultData = {
   transportId: string;
   nonce?: Snowflake;
};

export type VoiceProduceData = {
   channelId: Snowflake;
   transportId: string;
   kind: HMediaKind;
   rtpParameters: RtpParameters;
   nonce?: Snowflake;
};

export type VoiceProduceResult = VoiceError | VoiceProduceResultData;
export type VoiceProduceResultData = {
   producerId: string;
   kind: HMediaKind;
   nonce?: Snowflake;
};

export type VoiceProducerCreatedData = ProducerData;
export type VoiceProducerClosedData = ProducerData;

export type VoiceConsumerCreatedData = ConsumerData;
export type VoiceConsumerClosedData = ConsumerData;

export type VoiceConsumeData = {
   channelId: Snowflake;
   transportId: string;
   producerId: string;
   rtpCapabilities: RtpCapabilities;
   nonce?: Snowflake;
};

export type VoiceConsumeResult = VoiceError | VoiceConsumeResultData;
export type VoiceConsumeResultData = {
   consumerId: string;
   producerId: string;
   producerUserId: Snowflake;
   kind: HMediaKind;
   rtpParameters: RtpParameters;
   nonce?: Snowflake;
};

export type VoiceResumeConsumerData = {
   channelId: Snowflake;
   consumerId: string;
   nonce?: Snowflake;
};

export type VoiceResumeConsumerResult = VoiceError | VoiceResumeConsumerResultData;
export type VoiceResumeConsumerResultData = {
   consumerId: string;
   nonce?: Snowflake;
};

export type VoicePeerLeftData = {
   sessionId: Snowflake;
   userId: Snowflake;
   producerIds: string[];
   consumerIds: string[];
};

export type VoiceCloseProducerData = {
   channelId: Snowflake;
   producerId: string;
   nonce?: Snowflake;
};

export type VoiceCloseProducerResult = VoiceError | VoiceCloseProducerResultData;
export type VoiceCloseProducerResultData = { nonce?: Snowflake } & ProducerData;

export type VoiceCloseConsumerData = {
   channelId: Snowflake;
   consumerId: string;
   nonce?: Snowflake;
};

export type VoiceCloseConsumerResult = VoiceError | VoiceCloseConsumerResultData;
export type VoiceCloseConsumerResultData = { nonce?: Snowflake } & ConsumerData;

export type VoiceRestartIceData = {
   channelId: Snowflake;
   transportId: string;
   nonce?: Snowflake;
};

export type VoiceRestartIceResult = VoiceError | VoiceRestartIceResultData;
export type VoiceRestartIceResultData = {
   iceParameters: IceParameters;
   nonce?: Snowflake;
};

export type LocalVoiceState = {
   isAudioPaused: boolean;
};
