import type { Snowflake } from "./snowflake";

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
	[VoiceOperations.HEARTBEAT]: VoiceHeartbeat;
	[VoiceOperations.HEARTBEAT_ACK]: VoiceHeartbeatAck;
};

export type VoiceHeartbeat = VoicePayload & {
	op: VoiceOperations.HEARTBEAT;
	d: VoiceHeartbeatData;
};

export type VoiceHeartbeatData = number | undefined;

export type VoiceHeartbeatAck = VoicePayload & {
	op: VoiceOperations.HEARTBEAT_ACK;
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
	userId: Snowflake;
};

export type VoiceReady = VoicePayload & {
	rtpCapabilities: RTCRtpCapabilities;
};
