import type { GatewayCallState, GatewayVoiceState, Snowflake } from "@huginn/shared";
import { dispatchToTopic } from "#utils/gateway-utils";

export class VoiceManager {
	private callStates: Map<Snowflake, GatewayCallState>;
	private voiceStates: Map<Snowflake, GatewayVoiceState>;

	public constructor() {
		this.callStates = new Map();
		this.voiceStates = new Map();
	}

	public addCall(channelId: Snowflake, messageId: Snowflake, ringing: Snowflake[]) {
		const callState: GatewayCallState = { channelId, messageId, ringing };
		this.callStates.set(channelId, callState);
		console.log("add call", channelId);

		dispatchToTopic(channelId, "call_create", callState);
	}

	public updateCall(channelId: Snowflake, ringing: Snowflake[]) {
		const callState = this.callStates.get(channelId);
		if (callState) {
			callState.ringing = ringing;

			dispatchToTopic(channelId, "call_update", callState);
		}
	}

	public deleteCall(channelId: Snowflake) {
		if (this.callStates.has(channelId)) {
			this.callStates.delete(channelId);

			dispatchToTopic(channelId, "call_delete", { channelId });
		}
	}

	public updateVoiceState(
		userId: Snowflake,
		channelId: Snowflake | null,
		guildId: Snowflake | null,
		selfMute: boolean,
		selfDeaf: boolean,
		selfStream: boolean,
		selfVideo: boolean,
	) {
		const sendChannelId = this.voiceStates.get(userId)?.channelId;

		const voiceState: GatewayVoiceState = {
			userId: userId,
			channelId: channelId,
			guildId: guildId,
			selfMute: selfMute,
			selfDeaf: selfDeaf,
			selfStream: selfStream,
			selfVideo: selfVideo,
		};

		if (voiceState.channelId) {
			this.voiceStates.set(userId, voiceState);
			const callState = this.callStates.get(voiceState.channelId);
			if (callState?.ringing.includes(userId)) {
				this.updateCall(
					voiceState.channelId,
					callState.ringing.filter((x) => x !== userId),
				);
			}
		} else if (sendChannelId) {
			this.voiceStates.delete(userId);
		}

		if (sendChannelId) {
			this.checkForEmptyCalls(sendChannelId);
		}

		if (voiceState.channelId) {
			dispatchToTopic(voiceState.channelId, "voice_state_update", voiceState);
		} else if (sendChannelId) {
			dispatchToTopic(sendChannelId, "voice_state_update", voiceState);
		}
	}

	public getCallStates(channelIds: Snowflake[]) {
		const callStates: GatewayCallState[] = [];

		for (const call of this.callStates.values()) {
			if (channelIds.includes(call.channelId)) {
				callStates.push(call);
			}
		}

		return callStates;
	}

	public getVoiceStates(channelIds: Snowflake[]) {
		const voiceStates: GatewayVoiceState[] = [];

		for (const voiceState of this.voiceStates.values()) {
			if (voiceState.channelId && channelIds.includes(voiceState.channelId)) {
				voiceStates.push(voiceState);
			}
		}

		return voiceStates;
	}

	public getVoiceState(userId: Snowflake) {
		const voiceState = this.voiceStates.values().find((x) => x.userId === userId);
		return voiceState;
	}

	private checkForEmptyCalls(channelId: Snowflake) {
		console.log(Array.from(this.voiceStates.values()), channelId);
		if (!Array.from(this.voiceStates.values()).some((x) => x.channelId === channelId)) {
			this.deleteCall(channelId);
		}
	}
}
