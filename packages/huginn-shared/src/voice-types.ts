import type { types } from "mediasoup";
import type { DtlsParameters, IceCandidate, IceParameters, RtpCapabilities, RtpParameters } from "mediasoup/types";
import type { Snowflake } from "./snowflake";

export enum VoiceOperations {
   HELLO = 0,
   IDENTIFY = 1,
   HEARTBEAT = 2,
   HEARTBEAT_ACK = 3,
   DISPATCH = 4,
   PING = 5,
   PONG = 6,
}

export type VoiceOperationTypes = {
   [VoiceOperations.HELLO]: VoiceHello;
   [VoiceOperations.IDENTIFY]: VoiceIdentify;
   [VoiceOperations.HEARTBEAT]: VoiceHeartbeat;
   [VoiceOperations.HEARTBEAT_ACK]: VoiceHeartbeatAck;
   [VoiceOperations.DISPATCH]: VoiceDispatch;
   [VoiceOperations.PING]: VoicePing;
   [VoiceOperations.PONG]: VoicePong;
};

export type VoiceEvents = {
   local_consumer_created: { consumerId: string; producerId: string; track: MediaStreamTrack; producerUserId: Snowflake; kind: HMediaKind };
   send_transport_ready: { channelId: Snowflake };
   recv_transport_ready: { channelId: Snowflake };
   local_producer_created: { producerId: string; kind: HMediaKind; track: MediaStreamTrack };
   local_producer_changed: { producerId: string; kind: HMediaKind; track: MediaStreamTrack | null };
   local_voice_state_changed: LocalVoiceState;
};

export type VoiceWebsocketEvents = {
   hello: VoiceHelloData;
   identify: VoiceIdentifyData;
   ready: VoiceReadyData;

   transport_created: VoiceTransportCreatedData;
   transport_connected: VoiceTransportConnectedData;
   create_transport: VoiceCreateTransportData;
   connect_transport: VoiceConnectTransportData;

   produce: VoiceProduceData;
   producer_created: VoiceProducerCreatedData;
   new_producer: VoiceNewProducerData;
   close_producer: VoiceCloseProducerData;
   producer_closed: VoiceProducerClosedData;

   consume: VoiceConsumeData;
   consumer_created: VoiceConsumerCreatedData;
   consumer_resumed: VoiceConsumerResumedData;
   consumer_closed: VoiceConsumerClosedData;
   new_consumer: VoiceNewConsumerData;
   resume_consumer: VoiceResumeConsumerData;
   close_consumer: VoiceCloseConsumerData;

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
export type VoiceNewConsumerData = ConsumerData;

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
   consumerIds: string[];
};

export type VoiceCloseProducerData = {
   channelId: Snowflake;
   producerId: string;
};

export type VoiceProducerClosedData = ProducerData;

export type VoiceCloseConsumerData = {
   channelId: Snowflake;
   consumerId: string;
};

export type VoiceConsumerClosedData = ConsumerData;

export type LocalVoiceState = {
   isAudioPaused: boolean;
};

// export type LocalVoiceState = {
//    isAudioPaused: boolean;
//    isAudioMuted: boolean;
//    isAudioDeafened: boolean;
//    isStreaming: boolean;
//    isCameraOn: boolean;
// };
