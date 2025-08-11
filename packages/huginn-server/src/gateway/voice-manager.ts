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

   public updateVoiceState(options: GatewayVoiceState) {
      const previousChannelId = this.voiceStates.get(options.userId)?.channelId;

      const voiceState: GatewayVoiceState = { ...options };

      // If the new state is a valid channel, remove user from ringing and set new channel id
      if (voiceState.channelId) {
         this.voiceStates.set(options.userId, voiceState);
         const callState = this.callStates.get(voiceState.channelId);
         if (callState?.ringing.includes(options.userId)) {
            this.updateCall(
               voiceState.channelId,
               callState.ringing.filter((x) => x !== options.userId),
            );
         }
      }
      // Otherwise if it previously was valid set update user voice state channel id to null
      else if (previousChannelId) {
         this.voiceStates.delete(options.userId);
      }

      // If the user was previously in a different call, check if it's empty now
      if (previousChannelId && voiceState.channelId !== previousChannelId) {
         this.checkForEmptyCalls(previousChannelId);
      }

      // If the current channel is valid, send the state update to that channel
      if (voiceState.channelId) {
         // If the user is entering a new channel, send a null state to the previous one
         if (voiceState.channelId !== previousChannelId && previousChannelId) {
            dispatchToTopic(previousChannelId, "voice_state_update", { ...voiceState, channelId: null, guildId: null });
         }

         dispatchToTopic(voiceState.channelId, "voice_state_update", voiceState);
      }
      // Otherwise if it was previously valid, send the user's null state to that channel
      else if (previousChannelId) {
         dispatchToTopic(previousChannelId, "voice_state_update", voiceState);
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
      if (!Array.from(this.voiceStates.values()).some((x) => x.channelId === channelId)) {
         this.deleteCall(channelId);
      }
   }
}
