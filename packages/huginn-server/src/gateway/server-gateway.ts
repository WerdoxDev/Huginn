import { CommonWebsocket, createToken, verifyToken } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import {
   omitChannelRecipient,
   omitRelationshipUserIds,
   selectChannelDefaults,
   selectPrivateUser,
   selectRelationshipUser,
} from "@huginn/backend-shared/database/common";
import {
   analytics,
   CONSTANTS,
   GatewayCode,
   type GatewayHeartbeatAck,
   type GatewayHeartbeatData,
   type GatewayHello,
   type GatewayIdentifyData,
   GatewayOperations,
   type GatewayPayload,
   type GatewayResumeData,
   type GatewayUpdatePresenceData,
   type GatewayUpdateVoiceStateData,
   log,
   merge,
   recordSpanError,
   WorkerID,
} from "@huginn/shared";

import { filterChannel } from "#utils/helpers";

import { dispatchToTopic } from "../utils/gateway-utils";
import { ClientSession } from "./client-session";
import { PresenceManager } from "./presence-manager";
import { VoiceManager } from "./voice-manager";

export class ServerGateway extends CommonWebsocket<ClientSession, GatewayPayload> {
   public presenceManager: PresenceManager;
   public voiceManager: VoiceManager;

   public constructor() {
      super({ sessionDeleteTimeout: 1000 * 60, workerId: WorkerID.GATEWAY }, ClientSession);

      this.presenceManager = new PresenceManager();
      this.voiceManager = new VoiceManager();
   }

   public onOpen(session: ClientSession) {
      return analytics.startActiveSpan("gateway.onOpen", (span) => {
         span.setAttribute("params.session.id", session.sessionId);

         try {
            const helloData: GatewayHello = {
               op: GatewayOperations.HELLO,
               d: { heartbeatInterval: CONSTANTS.HEARTBEAT_INTERVAL, sessionId: session.sessionId },
            };

            span.setAttribute("heartbeat.interval", helloData.d.heartbeatInterval);
            session.send(helloData, false, false);
            // oxlint-disable-next-line no-unused-vars
         } catch (e) {
            recordSpanError(e);
            session.peer.close(GatewayCode.UNKNOWN, "UNKNOWN");
         } finally {
            span.end();
         }
      });
   }

   public async onClose(session: ClientSession, event: { code?: number; reason?: string }) {
      return analytics.startActiveSpan("gateway.onClose", (span) => {
         span.setAttributes(session.getDefaultAttributes());
         if (event.code) span.setAttribute("event.close.code", event.code);
         if (event.reason) span.setAttribute("event.close.reason", event.reason);
         span.end();
      });
   }

   public onDeleteSession(session: ClientSession): Promise<void> | void {
      return analytics.startActiveSpan("gateway.onDeleteSession", (span) => {
         span.setAttributes(session.getDefaultAttributes());
         try {
            if (!session.authenticated || !session.user) return;

            this.presenceManager.removeUserPresence(session.user.id, session);
            const voiceState = this.voiceManager.getVoiceState(session.user.id);
            if (voiceState?.sessionId === session.sessionId) {
               this.voiceManager.updateVoiceState({
                  userId: session.user.id,
                  sessionId: session.sessionId,
                  channelId: null,
                  guildId: null,
                  isAudioDeafened: false,
                  isAudioMuted: false,
                  isCameraOn: false,
                  isAudioStreaming: false,
                  isScreenSharing: false,
               });

               span.setAttribute("session.user.voice_state_cleared", true);
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         } finally {
            span.end();
         }
      });
   }

   public async onMessage(session: ClientSession, data: GatewayPayload) {
      // To skip trace
      if (data.op === GatewayOperations.HEARTBEAT) {
         this.handleHeartbeat(session, data.d as GatewayHeartbeatData);
         return;
      }

      return await analytics.startActiveSpan("gateway.onMessage", async (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.message.op": data.op,
            "params.message.type": "t" in data ? data.t : "null",
         });

         try {
            let needsAuthentication = false;

            switch (data.op) {
               case GatewayOperations.IDENTIFY:
                  await this.handleIdentify(session, data.d);
                  break;
               case GatewayOperations.RESUME:
                  await this.handleResume(session, data.d);
                  break;
               default:
                  needsAuthentication = true;
            }

            span.setAttribute("session.needs_authentication", needsAuthentication);

            if (needsAuthentication && !session?.authenticated) {
               session.peer.close(GatewayCode.NOT_AUTHENTICATED, "NOT_AUTHENTICATED");
               return;
            }

            if (!needsAuthentication) return;

            switch (data.op) {
               case GatewayOperations.VOICE_STATE_UPDATE:
                  this.handleUpdateVoiceState(session, data.d);
                  break;
               case GatewayOperations.PRESENCE_UPDATE:
                  this.handleUpdatePresence(session, data.d);
                  break;
               default:
                  session.peer.close(GatewayCode.UNKNOWN_OPCODE, "UNKNOWN_OPCODE");
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         } finally {
            span.end();
         }
      });
   }

   private handleHeartbeat(session: ClientSession, _data: GatewayHeartbeatData) {
      session.resetHeartbeatTimeout();
      const heartbeatAckData: GatewayHeartbeatAck = { op: GatewayOperations.HEARTBEAT_ACK };
      session.send(heartbeatAckData, false, true);
   }

   private async handleIdentify(session: ClientSession, data: GatewayIdentifyData) {
      return await analytics.startActiveSpan("gateway.handleIdentify", async (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.properties.browser": data.properties.browser,
            "params.properties.os": data.properties.os,
            "params.properties.device": data.properties.device,
         });

         try {
            const { valid, payload } = await verifyToken("user-access", data.token);
            span.setAttribute("token.valid", valid);

            if (!valid || !payload) {
               session.peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
               return;
            }

            if (session?.authenticated) {
               session.peer.close(GatewayCode.ALREADY_AUTHENTICATED, "ALREADY_AUTHENTICATED");
               return;
            }

            const user = await prisma.user.getById(payload.id, { select: selectPrivateUser });
            span.setAttribute("user.id", user.id);

            if (!session) {
               throw new Error("session was null in handleIdentify");
            }

            await session.initialize(user, { ...data.properties });

            // Relationships
            const userRelationships = await prisma.relationship.getUserRelationships(user.id, {
               include: selectRelationshipUser,
               omit: omitRelationshipUserIds,
            });

            // Channels
            const userChannels = await prisma.channel.getUserChannels(user.id, false, {
               select: merge(selectChannelDefaults, omitChannelRecipient(user.id)),
            });

            // Presences
            const presences = this.presenceManager.getUserPresences(session);

            // Read states (single batched query instead of per-channel N+1)
            const finalReadStates = await prisma.readState.getUserStatesWithUnreadCounts(user.id);

            // Settings
            const settings = await prisma.settings.getOrCreateSettings(user.id);

            const readyData: GatewayPayload = {
               op: GatewayOperations.DISPATCH,
               t: "ready",
               d: {
                  user,
                  privateChannels: userChannels.map((x) => filterChannel(x)),
                  relationships: userRelationships,
                  userSettings: settings,
                  presences,
                  readStates: finalReadStates,
                  callStates: this.voiceManager.getCallStates(userChannels.map((x) => x.id)),
                  voiceStates: this.voiceManager.getVoiceStates(userChannels.map((x) => x.id)),
               },
            };

            session.send(readyData, true, false);
            this.presenceManager.setUserPresence(user.id, session, settings);
         } catch (e) {
            recordSpanError(e);
            throw e;
         } finally {
            span.end();
         }
      });
   }

   private async handleResume(session: ClientSession, data: GatewayResumeData) {
      return await analytics.startActiveSpan("gateway.handleResume", async (span) => {
         span.setAttributes({ ...session.getDefaultAttributes(), "params.session_id": data.sessionId, "params.seq": data.seq });
         try {
            const { valid, payload } = await verifyToken("user-access", data.token);
            span.setAttribute("token.valid", valid);

            if (!valid || !payload) {
               session.peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
               return;
            }

            const result = await this.resumeSession(session, data.sessionId, data.seq, payload.id);

            span.setAttribute("resume.result", !!result);

            if (!result) return;

            const resumedData: GatewayPayload = {
               t: "resumed",
               op: GatewayOperations.DISPATCH,
               d: undefined,
            };

            const settings = await prisma.settings.getOrCreateSettings(result.user.id);

            result.oldSession.send(resumedData, true, false);
            this.presenceManager.setUserPresence(result.user.id, result.oldSession, settings);
         } catch (e) {
            recordSpanError(e);
            throw e;
         } finally {
            span.end();
         }
      });
   }

   private async handleUpdateVoiceState(session: ClientSession, data: GatewayUpdateVoiceStateData) {
      return await analytics.startActiveSpan("gateway.handleUpdateVoiceState", async (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.channel_id": data.channelId ?? "null",
            "params.guild_id": data.guildId ?? "null",
            "params.is_audio_deafened": data.isAudioDeafened,
            "params.is_audio_muted": data.isAudioMuted,
            "params.is_camera_on": data.isCameraOn,
            "params.is_audio_streaming": data.isAudioStreaming,
            "params.is_screen_sharing": data.isScreenSharing,
         });

         try {
            const userId = session?.user?.id;
            if (!session || !userId) return;

            const previousState = this.voiceManager.getVoiceState(userId);
            this.voiceManager.updateVoiceState({ userId, ...data, sessionId: session.sessionId });

            // If the new place is a valid channel and is not the same as before
            if (data.channelId && (previousState?.channelId !== data.channelId || previousState.sessionId !== session.sessionId)) {
               const token = await createToken("voice", { userId });
               dispatchToTopic(session.sessionId, "voice_server_update", { token });
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         } finally {
            span.end();
         }
      });
   }

   private async handleUpdatePresence(session: ClientSession, data: GatewayUpdatePresenceData) {
      return await analytics.startActiveSpan("gateway.handleUpdatePresence", (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.status": data.status,
            "params.activities_count": data.activities?.length ?? 0,
         });

         try {
            const userId = session.user?.id;

            // Make sure the status is valid.
            if (["offline", "online", "dnd", "idle"].includes(data.status) && userId) {
               this.presenceManager.updateUserPresence(userId, session, undefined, data.status, data.activities);
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         } finally {
            span.end();
         }
      });
   }
}
