import type { types } from "mediasoup";
import type { DtlsParameters, IceCandidate, IceParameters } from "mediasoup/node/lib/WebRtcTransportTypes";
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
	PRODUCER_REMOVED = 16,
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
};

export type VoicePayload<OP extends keyof VoiceOperationDatas | undefined = undefined> = {
	op: OP extends undefined ? VoiceOperations : OP;
	d: OP extends undefined ? VoiceOperationDatas[keyof VoiceOperationDatas] : VoiceOperationDatas[Exclude<OP, undefined>];
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
