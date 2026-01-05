import { error, GatewayCode, log, type Snowflake, snowflake, validateGatewayData } from "@huginn/shared";
import type { Message, Peer } from "crossws";
import type { CommonPayload, WebsocketOptions } from "#types";
import type { CommonClientSession } from "./common-client-session";
import { prisma, selectPrivateUser } from "#database";

type ClientSessionConstructor<T> = new (peer: Peer, sessionId: Snowflake) => T;

export abstract class CommonWebsocket<ClientSession extends CommonClientSession<Payload, unknown>, Payload extends CommonPayload> {
   public readonly sessions = new Map<Snowflake, ClientSession>();
   private readonly sessionDeleteTimeouts = new Map<Snowflake, ReturnType<typeof setTimeout>>();

   private clientSessionConstructor: ClientSessionConstructor<ClientSession>;
   private options: WebsocketOptions;

   public abstract onOpen(session: ClientSession): Promise<void> | void;
   public abstract onClose(session: ClientSession, event: { code?: number; reason?: string }): Promise<void> | void;
   public abstract onMessage(session: ClientSession, data: Payload): Promise<void> | void;
   public onDeleteSession?(session: ClientSession): Promise<void> | void;

   public constructor(options: WebsocketOptions, clientSessionConstructor: ClientSessionConstructor<ClientSession>) {
      this.options = options;
      this.clientSessionConstructor = clientSessionConstructor;
   }

   public async _internalOnOpen(peer: Peer) {
      const sessionId = snowflake.generateString(this.options.workerId);
      log("backend-shared:websocket", "default", "open", "wid:", this.options.workerId, "sid:", sessionId);

      peer.context.sessionId = sessionId;
      const session = this.createSession(peer, sessionId);

      await session.enqueue(() => this.onOpen(session));
   }

   public async _internalOnClose(peer: Peer, event: { code?: number; reason?: string }) {
      log("backend-shared:websocket", "default", "close", "wid:", this.options.workerId, "sid:", peer.context.sessionId, "code:", event.code);

      const session = this.sessions.get(peer.context.sessionId);
      if (!session) return;

      await session.enqueue(() => this.onClose(session, event));

      session.stopHeartbeatTimeout();

      if (event.code === GatewayCode.SWITCHING_CONNECTION) return;

      if (
         session.authenticated &&
         (event.code === GatewayCode.INVALID_SESSION || event.code === GatewayCode.INTENTIONAL_CLOSE || event.code === GatewayCode.GOING_AWAY)
      ) {
         this.deleteSession(session.sessionId);
      } else if (session.authenticated) {
         session.isStale = true;
         this.queueSessionDelete(session.sessionId);
      } else {
         this.deleteSession(session.sessionId);
      }
   }

   public async _internalOnMessage(peer: Peer, message: Message) {
      try {
         const data: Payload = message.json();

         if (!validateGatewayData(data)) {
            peer.close(GatewayCode.DECODE_ERROR, "DECODE_ERROR");
            return;
         }

         const session = this.sessions.get(peer.context.sessionId);
         if (!session) return;

         await session.enqueue(() => this.onMessage(session, data));
         // oxlint-disable-next-line no-unused-vars
      } catch (e) {
         error("backend-shared:websocket", "error in onMessage:", e);

         if (e instanceof SyntaxError) {
            peer.close(GatewayCode.DECODE_ERROR, "DECODE_ERROR");
            return;
         }

         peer.close(GatewayCode.UNKNOWN, "UNKNOWN");
      }
   }

   public subscribeSessionsToTopic(userId: Snowflake, topic: string) {
      log("backend-shared:websocket", "subscriptions", "subscribe", "wid:", this.options.workerId, "uid:", userId, "tpc:", topic);

      for (const [_sessionId, session] of this.sessions) {
         if (session.user?.id === userId) {
            session.subscribe(topic);
         }
      }
   }

   public unsubscribeSessionsFromTopic(userId: Snowflake, topic: string) {
      log("backend-shared:websocket", "subscriptions", "unsubscribe", "wid:", this.options.workerId, "uid:", userId, "tpc:", topic);

      for (const [_sessionId, session] of this.sessions) {
         if (session.user?.id === userId) {
            session.unsubscribe(topic);
         }
      }
   }

   public getSessionsCount() {
      return this.sessions.size;
   }

   public getSession(sessionId: string) {
      return this.sessions.get(sessionId);
   }

   public sendToTopic(topic: string, data: Payload) {
      for (const session of this.sessions.values()) {
         if (session.isSubscribed(topic)) {
            session.send(data, true, true);
         }
      }
   }

   private queueSessionDelete(sessionId: Snowflake) {
      log("backend-shared:websocket", "default", "queue session delete", "wid:", this.options.workerId, "sid:", sessionId);

      const timeout = setTimeout(async () => {
         const session = this.sessions.get(sessionId);
         if (!session || !session.isStale) return;

         log("backend-shared:websocket", "default", "delete session (queued)", "wid:", this.options.workerId, "sid:", sessionId);

         this.deleteSession(sessionId);
      }, this.options.sessionDeleteTimeout);

      if (this.sessionDeleteTimeouts.has(sessionId)) {
         this.cancelSessionDelete(sessionId);
      }

      this.sessionDeleteTimeouts.set(sessionId, timeout);
   }

   public cancelSessionDelete(sessionId: Snowflake) {
      log("backend-shared:websocket", "default", "cancel session delete", "wid:", this.options.workerId, "sid:", sessionId);

      if (this.sessionDeleteTimeouts.has(sessionId)) {
         const timeout = this.sessionDeleteTimeouts.get(sessionId);
         clearTimeout(timeout);
         this.sessionDeleteTimeouts.delete(sessionId);
      }
   }

   public async resumeSession(session: ClientSession, oldSessionId: Snowflake, lastSequence: number, userId: Snowflake) {
      const oldSession = this.sessions.get(oldSessionId);

      log("backend-shared:websocket", "default", "resume", "wid:", this.options.workerId, "osid:", oldSession?.sessionId, "sid:", session.sessionId);

      if (!oldSession || !oldSession.authenticated || !oldSession.properties) {
         session.peer.close(GatewayCode.INVALID_SESSION, "INVALID_SESSION");
         return;
      }

      if (oldSession.sequence === undefined || lastSequence > oldSession.sequence) {
         session.peer.close(GatewayCode.INVALID_SEQ, "INVALID_SEQ");
         return;
      }

      // Sometimes the new session reconnects so fast that the old one is still actually not considered as "disconnected" from the server
      if (oldSession.peer.websocket.readyState === WebSocket.OPEN) {
         oldSession.peer.close(GatewayCode.SWITCHING_CONNECTION, "SWITCHING_CONNECTION");
      }

      log("backend-shared:websocket", "default", "resuming", "wid:", this.options.workerId, "osid:", oldSession.sessionId, "seq:", lastSequence);

      const user = await prisma.user.getById(userId, { select: selectPrivateUser });

      session.peer.context.sessionId = oldSession.sessionId;
      oldSession.peer = session.peer;
      oldSession.isStale = false;
      // Reset the old session's timeout when resumed
      oldSession.resetHeartbeatTimeout();
      this.cancelSessionDelete(oldSession.sessionId);
      await oldSession.initialize(user, { ...oldSession.properties });

      // This session is initialized for the peer right at connection. We need to delete it.
      session.stopHeartbeatTimeout();
      this.deleteSession(session.sessionId);

      const messageQueue = oldSession.getMessages();

      for (const [seq, _data] of messageQueue) {
         if (seq <= lastSequence) continue;

         oldSession.send(_data, false, false);
      }

      return { oldSession, user };
   }

   public async deleteSession(sessionId: Snowflake) {
      log("backend-shared:websocket", "default", "delete session", "wid:", this.options.workerId, "sid:", sessionId);
      const session = this.sessions.get(sessionId);
      if (session) {
         await this.onDeleteSession?.(session);
         this.sessions.delete(sessionId);
      }
   }

   private createSession(peer: Peer, sessionId: Snowflake) {
      log("backend-shared:websocket", "default", "create session", "wid:", this.options.workerId, "sid:", sessionId);

      const session = new this.clientSessionConstructor(peer, sessionId);
      this.sessions.set(sessionId, session);

      return session;
   }
}
