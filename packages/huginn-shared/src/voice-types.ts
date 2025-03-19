import type { Snowflake } from "@sapphire/snowflake";

export enum VoiceOperations {
	HELLO = 0,
	IDENTIFY = 1,
	HEARTBEAT = 2,
	HEARTBEAT_ACK = 3,
	READY = 4,
	DECODE_ERROR = 5,
}

export type VoiceOperationTypes = {
	[VoiceOperations.HELLO]: VoiceHello;
	[VoiceOperations.IDENTIFY]: VoiceIdentify;
	[VoiceOperations.READY]: VoiceReady;
};

export type VoicePayload = {
	op: VoiceOperations;
	d: unknown;
};

export type VoiceHello = VoicePayload & {
	d: VoiceHelloData;
};

export type VoiceHelloData = {
	heartbeatInterval: number;
};

export type VoiceIdentify = VoicePayload & {
	d: VoiceIdentifyData;
};

export type VoiceIdentifyData = {
	token: string;
	sessionId: Snowflake;
	userId: Snowflake;
};

export type VoiceReady = VoicePayload & {
	rtpCapabilities: RTCRtpCapabilities;
};
