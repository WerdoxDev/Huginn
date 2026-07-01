import { prisma, selectAllMessage } from "@huginn/backend-shared/database";
import { analytics, recordSpanError, type GatewayCallState, type GatewayVoiceState, type Snowflake } from "@huginn/shared";

import { voiceLogger } from "#loggers";
import { dispatchToTopic } from "#utils/gateway-utils";
import { filterMessage } from "#utils/helpers";

export class VoiceManager {
   private callStates: Map<Snowflake, GatewayCallState>;
   private voiceStates: Map<Snowflake, GatewayVoiceState>;
   private callParticipants: Map<Snowflake, Snowflake[]>;

   public constructor() {
      this.callStates = new Map();
      this.voiceStates = new Map();
      this.callParticipants = new Map();
   }

   public addCall(channelId: Snowflake, messageId: Snowflake, initiatorId: Snowflake, ringing: Snowflake[]) {
      return analytics.startActiveSpan("voiceManager.addCall", (span) => {
         try {
            span.setAttributes({
               "params.channel.id": channelId,
               "params.message.id": messageId,
               "params.initiator.id": initiatorId,
               "params.ringing.count": ringing.length,
            });

            const callState: GatewayCallState = { channelId, messageId, ringing };
            this.callStates.set(channelId, callState);
            this.callParticipants.set(channelId, [initiatorId]);

            dispatchToTopic(channelId, "call_create", callState);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public sendCallStateToUser(channelId: Snowflake, userId: Snowflake) {
      return analytics.startActiveSpan("voiceManager.sendCallStateToUser", (span) => {
         try {
            const callState = this.callStates.get(channelId);

            span.setAttributes({
               "params.channel.id": channelId,
               "params.user.id": userId,
               "call.found": !!callState,
               "call.ringing.count": callState?.ringing.length ?? "null",
            });

            if (callState) {
               dispatchToTopic(userId, "call_create", callState);

               let voiceStatesSent = 0;
               // Send all voice states for users in this call
               for (const voiceState of this.voiceStates.values()) {
                  if (voiceState.channelId === channelId && voiceState.userId !== userId) {
                     dispatchToTopic(userId, "voice_state_update", voiceState);
                     voiceStatesSent++;
                  }
               }

               span.setAttributes({ "call.voice_states_sent": voiceStatesSent });
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public updateCall(channelId: Snowflake, ringing: Snowflake[]) {
      return analytics.startActiveSpan("voiceManager.updateCall", (span) => {
         try {
            const callState = this.callStates.get(channelId);

            span.setAttributes({
               "params.channel.id": channelId,
               "params.ringing.count": ringing.length,
               "call.found": !!callState,
            });

            if (callState) {
               callState.ringing = ringing;
               dispatchToTopic(channelId, "call_update", callState);
            }

            this.checkForEmptyCall(channelId);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async deleteCall(channelId: Snowflake) {
      return analytics.startActiveSpan("voiceManager.deleteCall", async (span) => {
         try {
            const callState = this.callStates.get(channelId);

            span.setAttributes({
               "params.channel.id": channelId,
               "call.found": !!callState,
               "call.message.id": callState?.messageId ?? "null",
            });

            if (callState) {
               dispatchToTopic(channelId, "call_delete", { channelId });

               const participants = this.callParticipants.get(channelId);

               span.setAttributes({ "call.participants.count": participants?.length ?? "null" });

               if (participants) {
                  const updatedMessage = await prisma.message.updateMessage(
                     callState.messageId,
                     { call: { participants: participants, setEndedTimestamp: true } },
                     { select: selectAllMessage },
                  );

                  dispatchToTopic(channelId, "message_update", await filterMessage(updatedMessage));
               }

               this.callStates.delete(channelId);
               voiceLogger.info({ channelId }, "call deleted");
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public updateVoiceState(options: GatewayVoiceState) {
      return analytics.startActiveSpan("voiceManager.updateVoiceState", (span) => {
         try {
            const previousState = this.voiceStates.get(options.userId);
            const previousChannelId = previousState?.channelId;

            span.setAttributes({
               "params.user.id": options.userId,
               "params.channel.id": options.channelId ?? "null",
               "params.session.id": options.sessionId,
               "voice.previous_channel.id": previousChannelId ?? "null",
               "voice.has_previous_state": !!previousState,
               "voice.is_session_change": !!previousState && options.sessionId !== previousState.sessionId,
               "voice.is_channel_change": !!previousChannelId && options.channelId !== previousChannelId,
            });

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

               // Add the participant to the call
               const participants = this.callParticipants.get(voiceState.channelId);
               if (participants) {
                  this.callParticipants.set(voiceState.channelId, [...participants.filter((x) => x !== voiceState.userId), voiceState.userId]);
               }
            }
            // Otherwise if it previously was valid set update user voice state channel id to null
            else if (previousChannelId) {
               this.voiceStates.delete(options.userId);
            }

            // If the current channel is valid, send the state update to that channel
            if (voiceState.channelId) {
               // The user is joining with a new session
               if (previousState && voiceState.sessionId !== previousState?.sessionId) {
                  voiceLogger.info({ userId: options.userId, previousSessionId: previousState.sessionId }, "session change - nulling previous session");
                  dispatchToTopic(previousState.sessionId, "voice_state_update", {
                     ...previousState,
                     channelId: null,
                     guildId: null,
                  });
               }

               // If the user is entering a new channel, send a null state to the previous one
               if (previousChannelId && voiceState.channelId !== previousChannelId) {
                  voiceLogger.info({ userId: options.userId, previousChannelId }, "channel change - nulling previous channel");
                  dispatchToTopic(previousChannelId, "voice_state_update", {
                     ...voiceState,
                     channelId: null,
                     guildId: null,
                  });
               }

               dispatchToTopic(voiceState.channelId, "voice_state_update", voiceState);
            }
            // Otherwise if it was previously valid, send the user's null state to that channel
            else if (previousChannelId) {
               dispatchToTopic(previousChannelId, "voice_state_update", voiceState);
               voiceLogger.info({ userId: options.userId, previousChannelId }, "user left channel - sending null state");
            }

            // If the user was previously in a different call, check if it's empty now
            if (previousChannelId && voiceState.channelId !== previousChannelId) {
               this.checkForEmptyCall(previousChannelId);
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public getCallStates(channelIds: Snowflake[]) {
      return analytics.startActiveSpan("voiceManager.getCallStates", (span) => {
         try {
            span.setAttributes({
               "params.channel_ids.count": channelIds.length,
               "call.total_tracked": this.callStates.size,
            });

            const callStates: GatewayCallState[] = [];
            for (const call of this.callStates.values()) {
               if (channelIds.includes(call.channelId)) {
                  callStates.push(call);
               }
            }

            span.setAttributes({ "call.returned.count": callStates.length });

            return callStates;
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public getVoiceStates(channelIds: Snowflake[]) {
      return analytics.startActiveSpan("voiceManager.getVoiceStates", (span) => {
         try {
            span.setAttributes({
               "params.channel_ids.count": channelIds.length,
               "voice.total_tracked": this.voiceStates.size,
            });

            const voiceStates: GatewayVoiceState[] = [];
            for (const voiceState of this.voiceStates.values()) {
               if (voiceState.channelId && channelIds.includes(voiceState.channelId)) {
                  voiceStates.push(voiceState);
               }
            }

            span.setAttributes({ "voice.returned.count": voiceStates.length });

            return voiceStates;
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public getVoiceState(userId: Snowflake) {
      return analytics.startActiveSpan("voiceManager.getVoiceState", (span) => {
         try {
            const voiceState = this.voiceStates.values().find((x) => x.userId === userId);

            span.setAttributes({
               "params.user.id": userId,
               "voice.found": !!voiceState,
               "voice.channel.id": voiceState?.channelId ?? "null",
            });

            return voiceState;
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   private checkForEmptyCall(channelId: Snowflake) {
      if (!Array.from(this.voiceStates.values()).some((x) => x.channelId === channelId)) {
         voiceLogger.info({ channelId }, "call is empty - deleting");
         this.deleteCall(channelId);
      }
   }
}
