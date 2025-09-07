import { CommonWebsocket, createToken, verifyToken } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import {
   omitChannelRecipient,
   omitRelationshipUserIds,
   selectChannelRecipients,
   selectPrivateUser,
   selectRelationshipUser,
} from "@huginn/backend-shared/database/common";
import {
   type APIReadStateWithoutUser,
   constants,
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
   WorkerID,
} from "@huginn/shared";
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
      log("server:gateway", "default", "open", "sid:", session.sessionId);

      try {
         const helloData: GatewayHello = {
            op: GatewayOperations.HELLO,
            d: { heartbeatInterval: constants.HEARTBEAT_INTERVAL, sessionId: session.sessionId },
         };

         log("server:gateway", "send", "hello", "intrvl:", helloData.d.heartbeatInterval, "sid:", session.sessionId);
         this.send(session.peer, helloData);
         // oxlint-disable-next-line no-unused-vars
      } catch (e) {
         session.peer.close(GatewayCode.UNKNOWN, "UNKNOWN");
      }
   }

   public async onClose(session: ClientSession, event: { code?: number; reason?: string }) {
      log("server:gateway", "default", "close", "sid:", session.sessionId, "auth:", session.authenticated, "code:", event.code, "res:", event.reason);

      if (session.authenticated && session.user) {
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
               isStreaming: false,
            });
         }
      }
   }

   public async onMessage(session: ClientSession, data: GatewayPayload) {
      log(
         "server:gateway",
         "recv",
         "sid:",
         session?.sessionId,
         "uid:",
         session?.user?.id,
         "op:",
         data.op,
         "t:",
         "t" in data && data.t,
         "s:",
         "s" in data && data.s,
      );

      let needsAuthentication = false;

      switch (data.op) {
         case GatewayOperations.IDENTIFY:
            await this.handleIdentify(session, data.d);
            break;
         case GatewayOperations.HEARTBEAT:
            this.handleHeartbeat(session, data.d);
            break;
         case GatewayOperations.RESUME:
            await this.handleResume(session, data.d);
            break;
         default:
            needsAuthentication = true;
      }

      if (needsAuthentication && !session?.authenticated) {
         session.peer.close(GatewayCode.NOT_AUTHENTICATED, "NOT_AUTHENTICATED");
         return;
      }

      if (!needsAuthentication) {
         return;
      }

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
   }

   private handleHeartbeat(session: ClientSession, _data: GatewayHeartbeatData) {
      log("server:gateway", "heartbeat", "sid:", session.sessionId, "uid:", session?.user?.id);

      session.resetHeartbeatTimeout();
      const heartbeatAckData: GatewayHeartbeatAck = { op: GatewayOperations.HEARTBEAT_ACK };
      this.send(session.peer, heartbeatAckData);
   }

   private async handleIdentify(session: ClientSession, data: GatewayIdentifyData) {
      const { valid, payload } = await verifyToken("user-access", data.token);

      log("server:gateway", "recv", "identify", "tkn:", data.token, "valid:", valid);
      log("server:gateway", "detail-identify", "start", "sid:", session.sessionId);

      if (!valid || !payload) {
         session.peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
         return;
      }

      if (session?.authenticated) {
         session.peer.close(GatewayCode.ALREADY_AUTHENTICATED, "ALREADY_AUTHENTICATED");
         return;
      }

      const user = await prisma.user.getById(payload.id, { select: selectPrivateUser });

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
         include: merge(selectChannelRecipients, omitChannelRecipient(user.id)),
      });

      // Presences
      const presences = this.presenceManager.getUserPresences(session);

      // Read states
      const dbReadStates = await prisma.readState.getUserStates(user.id);
      const finalReadStates: APIReadStateWithoutUser[] = [];

      for (const readState of dbReadStates) {
         finalReadStates.push({
            channelId: readState.channelId,
            lastReadMessageId: readState.lastReadMessageId,
            unreadCount: await prisma.readState.countUnreadMessages(readState.userId, readState.channelId),
         });
      }

      // Settings
      const settings = await prisma.settings.getOrCreateSettings(user.id);

      const readyData: GatewayPayload<"ready"> = {
         op: GatewayOperations.DISPATCH,
         d: {
            user,
            privateChannels: userChannels,
            relationships: userRelationships,
            userSettings: settings,
            presences,
            readStates: finalReadStates,
            callStates: this.voiceManager.getCallStates(userChannels.map((x) => x.id)),
            voiceStates: this.voiceManager.getVoiceStates(userChannels.map((x) => x.id)),
         },
         t: "ready",
         s: session.getIncreasedSequence(),
      };

      this.send(session.peer, readyData);
      this.presenceManager.setUserPresence(user.id, session, settings);

      log("server:gateway", "detail-identify", "end", "sid:", session.sessionId);
   }

   private async handleResume(session: ClientSession, data: GatewayResumeData) {
      const { valid, payload } = await verifyToken("user-access", data.token);

      log("server:gateway", "recv", "resume", "dsid:", data.sessionId, "seq:", data.seq, "valid:", valid);

      if (!valid || !payload) {
         session.peer.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
         return;
      }

      const result = await this.resumeSession(session, data.sessionId, data.seq, payload.id);

      if (!result) {
         return;
      }

      const resumedData: GatewayPayload = {
         t: "resumed",
         op: GatewayOperations.DISPATCH,
         d: undefined,
         s: result.oldSession.getIncreasedSequence(),
      };

      const settings = await prisma.settings.getOrCreateSettings(result.user.id);

      this.send(result.oldSession.peer, resumedData);
      this.presenceManager.setUserPresence(result.user.id, result.oldSession, settings);
   }

   private async handleUpdateVoiceState(session: ClientSession, data: GatewayUpdateVoiceStateData) {
      const userId = session?.user?.id;

      log(
         "server:gateway",
         "recv",
         "update voice state",
         "pid:",
         session.peer.id,
         "uid:",
         userId,
         "sm:",
         data.isAudioMuted,
         "sd:",
         data.isAudioDeafened,
         "ss:",
         data.isStreaming,
         "sv:",
         data.isCameraOn,
      );

      if (!session || !userId) {
         return;
      }

      const previousState = this.voiceManager.getVoiceState(userId);
      this.voiceManager.updateVoiceState({ userId, ...data, sessionId: session.sessionId });

      // If the new place is a valid channel and is not the same as before
      if (data.channelId && (previousState?.channelId !== data.channelId || previousState.sessionId !== session.sessionId)) {
         const token = await createToken("voice", { userId });
         dispatchToTopic(session.sessionId, "voice_server_update", { token });
      }
   }

   private async handleUpdatePresence(session: ClientSession, data: GatewayUpdatePresenceData) {
      const userId = session.user?.id;

      log("server:gateway", "recv", "update presence", "sid:", session.sessionId, "uid:", userId, "sts:", data.status);

      if (userId) {
         this.presenceManager.updateUserPresence(userId, undefined, data.status, data.activities);
      }
   }
}
