import type { types } from "mediasoup";
import type { DtlsParameters, IceCandidate, IceParameters } from "mediasoup/node/lib/WebRtcTransportTypes";
import type { MediaKind, RtpCapabilities, RtpParameters } from "mediasoup/node/lib/rtpParametersTypes";
import type { Snowflake } from "./snowflake";

export enum VoiceOperations {
	HELLO = 0,
	IDENTIFY = 1,
	HEARTBEAT = 2,
	HEARTBEAT_ACK = 3,
	READY = 4,
	CREATE_TRANSPORT = 5,
	TRANSPORT_CREATED = 6,
	CONNECT_TRANSPORT = 7,
	TRANSPORT_CONNECTED = 8,
	PRODUCE = 9,
	PRODUCER_CREATED = 10,
	NEW_PRODUCER = 11,
	CONSUME = 12,
	CONSUMER_CREATED = 13,
	RESUME_CONSUMER = 14,
	CONSUMER_RESUMED = 15,
	PEER_LEFT = 16,
	DECODE_ERROR = 17,
}

export type VoiceOperationDatas = {
	[VoiceOperations.HELLO]: VoiceHelloData;
	[VoiceOperations.IDENTIFY]: VoiceIdentifyData;
	[VoiceOperations.READY]: VoiceReadyData;
	[VoiceOperations.HEARTBEAT]: VoiceHeartbeatData;
	[VoiceOperations.HEARTBEAT_ACK]: undefined;
	[VoiceOperations.CREATE_TRANSPORT]: VoiceCreateTransportData;
	[VoiceOperations.TRANSPORT_CREATED]: VoiceTransportCreatedData;
	[VoiceOperations.CONNECT_TRANSPORT]: VoiceConnectTransportData;
	[VoiceOperations.TRANSPORT_CONNECTED]: VoiceTransportConnectedData;
	[VoiceOperations.PRODUCE]: VoiceProduceData;
	[VoiceOperations.PRODUCER_CREATED]: VoiceProducerCreatedData;
	[VoiceOperations.NEW_PRODUCER]: VoiceNewProducerData;
	[VoiceOperations.CONSUME]: VoiceConsumeData;
	[VoiceOperations.CONSUMER_CREATED]: VoiceConsumerCreatedData;
	[VoiceOperations.RESUME_CONSUMER]: VoiceResumeConsumerData;
	[VoiceOperations.CONSUMER_RESUMED]: VoiceConsumerResumedData;
	[VoiceOperations.PEER_LEFT]: VoicePeerLeftData;
};

export type VoiceEvents = {
	transport_ready: { channelId: Snowflake };
	producer_created: { consumerId: string; producerId: string; track: MediaStreamTrack; producerUserId: Snowflake };
	producer_removed: { producerId: string };
};

export type VoicePayload<OP extends keyof VoiceOperationDatas | undefined = undefined> = {
	op: OP extends undefined ? VoiceOperations : OP;
	d: OP extends undefined ? VoiceOperationDatas[keyof VoiceOperationDatas] : VoiceOperationDatas[Exclude<OP, undefined>];
};

export type ProducerData = {
	producerId: string;
	producerUserId: string;
	kind: MediaKind;
};

export type VoiceHeartbeatData = number | undefined;

export type VoiceHelloData = {
	heartbeatInterval: number;
};

export type VoiceIdentifyData = {
	token: string;
	channelId: Snowflake;
	guildId: Snowflake | null;
	userId: Snowflake;
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
	channelId: string;
	transportId: string;
	kind: MediaKind;
	rtpParameters: RtpParameters;
};

export type VoiceProducerCreatedData = {
	producerId: string;
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
	kind: MediaKind;
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
	peerId: string;
	producerIds: string[];
};
