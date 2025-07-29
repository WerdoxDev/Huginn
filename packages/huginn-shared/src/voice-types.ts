import type { types } from "mediasoup";
import type { RtpCapabilities, RtpParameters } from "mediasoup/node/lib/rtpParametersTypes";
import type { DtlsParameters, IceCandidate, IceParameters } from "mediasoup/node/lib/WebRtcTransportTypes";
import type { Snowflake } from "./snowflake";

export type VoiceStatus = "disconnected" | "connecting" | "connected" | "authenticated" | "reconnecting" | "rtc_ready" | "none";

export enum VoiceOperations {
   HELLO = 0,
   IDENTIFY = 1,
   HEARTBEAT = 2,
   HEARTBEAT_ACK = 3,
   DISPATCH = 4,
   PING = 5,
   PONG = 6,
   // READY = 4,
   // CREATE_TRANSPORT = 5,
   // TRANSPORT_CREATED = 6,
   // CONNECT_TRANSPORT = 7,
   // TRANSPORT_CONNECTED = 8,
   // PRODUCE = 9,
   // PRODUCER_CREATED = 10,
   // NEW_PRODUCER = 11,
   // CONSUME = 12,
   // CONSUMER_CREATED = 13,
   // RESUME_CONSUMER = 14,
   // CONSUMER_RESUMED = 15,
   // PEER_LEFT = 16,
   // DECODE_ERROR = 17,
   // CLOSE_PRODUCER = 20,
   // PRODUCER_CLOSED = 21,
}

export type VoiceOperationTypes = {
   [VoiceOperations.HELLO]: VoiceHello;
   [VoiceOperations.IDENTIFY]: VoiceIdentify;
   // [VoiceOperations.READY]: VoiceReadyData;
   [VoiceOperations.HEARTBEAT]: VoiceHeartbeat;
   [VoiceOperations.HEARTBEAT_ACK]: VoiceHeartbeatAck;
   // [VoiceOperations.CREATE_TRANSPORT]: VoiceCreateTransportData;
   // [VoiceOperations.TRANSPORT_CREATED]: VoiceTransportCreatedData;
   // [VoiceOperations.CONNECT_TRANSPORT]: VoiceConnectTransportData;
   // [VoiceOperations.TRANSPORT_CONNECTED]: VoiceTransportConnectedData;
   // [VoiceOperations.PRODUCE]: VoiceProduceData;
   // [VoiceOperations.PRODUCER_CREATED]: VoiceProducerCreatedData;
   // [VoiceOperations.NEW_PRODUCER]: VoiceNewProducerData;
   // [VoiceOperations.CONSUME]: VoiceConsumeData;
   // [VoiceOperations.CONSUMER_CREATED]: VoiceConsumerCreatedData;
   // [VoiceOperations.RESUME_CONSUMER]: VoiceResumeConsumerData;
   // [VoiceOperations.CONSUMER_RESUMED]: VoiceConsumerResumedData;
   // [VoiceOperations.PEER_LEFT]: VoicePeerLeftData;
   [VoiceOperations.DISPATCH]: VoiceDispatch;
   [VoiceOperations.PING]: VoicePing;
   [VoiceOperations.PONG]: VoicePong;
   // [VoiceOperations.CLOSE_PRODUCER]: VoiceCloseProducerData;
   // [VoiceOperations.PRODUCER_CLOSED]: VoiceProducerClosedData;
};

export type VoiceEvents = {
   message: VoicePayload;
   open: undefined;
   close: number;
   hello: VoiceHelloData;
   status_changed: VoiceStatus;
   identify: VoiceIdentifyData;
   ready: VoiceReadyData;
   create_transport: VoiceCreateTransportData;
   transport_created: VoiceTransportCreatedData;
   connect_transport: VoiceConnectTransportData;
   transport_connected: VoiceTransportConnectedData;
   produce: VoiceProduceData;
   producer_created: VoiceProducerCreatedData;
   new_producer: VoiceNewProducerData;
   consume: VoiceConsumeData;
   consumer_created: VoiceConsumerCreatedData;
   resume_consumer: VoiceResumeConsumerData;
   consumer_resumed: VoiceConsumerResumedData;
   peer_left: VoicePeerLeftData;
   close_producer: VoiceCloseProducerData;
   producer_closed: VoiceProducerClosedData;
   close_consumer: VoiceCloseConsumerData;
   consumer_closed: VoiceConsumerClosedData;
   pong: { rtt: number };

   local_consumer_created: { consumerId: string; producerId: string; track: MediaStreamTrack; producerUserId: Snowflake; kind: HMediaKind };
   send_transport_ready: { channelId: Snowflake };
   recv_transport_ready: { channelId: Snowflake };
   local_producer_created: { producerId: string; kind: HMediaKind; track: MediaStreamTrack };
   local_producer_changed: { producerId: string; kind: HMediaKind; track: MediaStreamTrack | null };
   local_voice_state_changed: LocalVoiceState;
};

export type VoicePayload<Event extends keyof VoiceEvents | undefined = undefined> = Event extends undefined
   ? {
        [K in keyof VoiceOperationTypes]: VoiceOperationTypes[K]["op"] extends VoiceOperations.DISPATCH
           ? VoiceDispatch
           : {
                op: K;
                // biome-ignore lint/complexity/noBannedTypes: it's required here
             } & ("d" extends keyof VoiceOperationTypes[K] ? { d: VoiceOperationTypes[K]["d"] } : {}) &
                ("s" extends keyof VoiceOperationTypes[K] ? { s?: number } : {}) &
                ("t" extends keyof VoiceOperationTypes[K] ? { t: string } : {});
     }[keyof VoiceOperationTypes]
   : {
        op: VoiceOperations.DISPATCH;
        s?: number;
        d: VoiceEvents[Extract<Event, keyof VoiceEvents>];
        t: Event;
     };

// export type VoicePayload<Op extends keyof VoiceOperationTypes | undefined = undefined> =
//    Op extends keyof VoiceOperationTypes
//    ? { op: Op; s: number; d: VoiceOperationTypes[Op]; }
//    : {
//       [K in keyof VoiceOperationTypes]: {
//          op: K;
//          s: number;
//          d: VoiceOperationTypes[K];
//       }
//    }[keyof VoiceOperationTypes];

export type VoiceDispatch = {
   [K in keyof VoiceEvents]: {
      op: VoiceOperations.DISPATCH;
      s?: number;
      t: K;
      d: VoiceEvents[K];
   };
}[keyof VoiceEvents];

// export type VoicePayload<OP extends keyof VoiceOperationTypes | undefined = undefined> = {
//    op: OP extends undefined ? VoiceOperations : OP;
//    d: OP extends undefined ? VoiceOperationTypes[keyof VoiceOperationTypes] : VoiceOperationTypes[Exclude<OP, undefined>];
// };

export type MediasoupAppData = { mediaKind: HMediaKind; userId: Snowflake };

export type HMediaKind = "microphone" | "stream_audio" | "stream_video" | "camera" | "unknown";

export type ProducerData = {
   producerId: string;
   producerUserId: Snowflake;
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
};

export type VoiceCreateTransportData = {
   channelId: Snowflake;
   direction: "send" | "recv";
};

export type VoiceTransportCreatedData = {
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
};

export type VoiceTransportConnectedData = {
   transportId: string;
};

export type VoiceProduceData = {
   channelId: Snowflake;
   transportId: string;
   kind: HMediaKind;
   rtpParameters: RtpParameters;
};

export type VoiceProducerCreatedData = {
   producerId: string;
   kind: HMediaKind;
};

export type VoiceNewProducerData = ProducerData;

export type VoiceConsumeData = {
   channelId: Snowflake;
   transportId: string;
   producerId: string;
   rtpCapabilities: RtpCapabilities;
};

export type VoiceConsumerCreatedData = {
   consumerId: string;
   producerId: string;
   producerUserId: Snowflake;
   kind: HMediaKind;
   rtpParameters: RtpParameters;
};

export type VoiceResumeConsumerData = {
   channelId: Snowflake;
   consumerId: string;
};

export type VoiceConsumerResumedData = {
   consumerId: string;
};

export type VoicePeerLeftData = {
   sessionId: Snowflake;
   userId: Snowflake;
   producerIds: string[];
};

export type VoiceCloseProducerData = {
   channelId: Snowflake;
   producerId: string;
};

export type VoiceProducerClosedData = {
   producerId: string;
   userId: string;
};

export type VoiceCloseConsumerData = {
   channelId: Snowflake;
   consumerId: string;
};

export type VoiceConsumerClosedData = {
   producerId: string;
   consumerId: string;
   userId: Snowflake;
};

export type LocalVoiceState = { isAudioPaused: boolean; isAudioMuted: boolean; isAudioDeafened: boolean; isStreaming: boolean; isCameraOn: boolean };
