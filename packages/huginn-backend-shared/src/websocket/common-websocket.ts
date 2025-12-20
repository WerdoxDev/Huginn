import { error, GatewayCode, log, type Snowflake, snowflake, validateGatewayData } from "@huginn/shared";
import type { Message, Peer } from "crossws";
import { prisma } from "#database";
import { selectPrivateUser } from "#database/common";
import type { CommonPayload, WebsocketOptions } from "#types";
import type { CommonClientSession } from "./common-client-session";

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

      peer.context.sessionId = sessionId;
      const session = this.createSession(peer, sessionId);

      await session.enqueue(() => this.onOpen(session));
   }

   public async _internalOnClose(peer: Peer, event: { code?: number; reason?: string }) {
      const session = this.sessions.get(peer.context.sessionId);

      if (!session) {
         return;
      }

      await session.enqueue(() => this.onClose(session, event));

      session.stopHeartbeatTimeout();

      if ((session.authenticated && event.code === GatewayCode.INVALID_SESSION) || event.code === GatewayCode.INTENTIONAL_CLOSE) {
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

         if (!session) {
            return;
         }

         await session.enqueue(() => this.onMessage(session, data));
         // oxlint-disable-next-line no-unused-vars
      } catch (e) {
         error("shared:websocket", "Error in onMessage:", e);

         if (e instanceof SyntaxError) {
            peer.close(GatewayCode.DECODE_ERROR, "DECODE_ERROR");
            return;
         }

         peer.close(GatewayCode.UNKNOWN, "UNKNOWN");
      }
   }

   public subscribeSessionsToTopic(userId: Snowflake, topic: string) {
      log("shared:websocket", "subscriptions", "subscribe", "uid:", userId, "tpc:", topic);

      for (const [_sessionId, session] of this.sessions) {
         if (session.user?.id === userId) {
            session.subscribe(topic);
         }
      }
   }

   public unsubscribeSessionsFromTopic(userId: Snowflake, topic: string) {
      log("shared:websocket", "subscriptions", "unsubscribe", "uid:", userId, "tpc:", topic);

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
      log("shared:websocket", "default", "queue session delete", "wid:", this.options.workerId, "sid:", sessionId);

      const timeout = setTimeout(async () => {
         const session = this.sessions.get(sessionId);

         if (!session || !session.isStale) {
            return;
         }

         await this.onDeleteSession?.(session);
         this.deleteSession(sessionId);
      }, this.options.sessionDeleteTimeout);

      this.sessionDeleteTimeouts.set(sessionId, timeout);
   }

   public cancelSessionDelete(sessionId: Snowflake) {
      const timeout = this.sessionDeleteTimeouts.get(sessionId);
      if (timeout) {
         clearTimeout(timeout);
         this.sessionDeleteTimeouts.delete(sessionId);
      }
   }

   public async resumeSession(session: ClientSession, oldSessionId: Snowflake, lastSequence: number, userId: Snowflake) {
      const oldSession = this.sessions.get(oldSessionId);

      if (!oldSession || !oldSession.authenticated || !oldSession.properties) {
         session.peer.close(GatewayCode.INVALID_SESSION, "INVALID_SESSION");
         return;
      }

      if (oldSession.sequence === undefined || lastSequence > oldSession.sequence) {
         session.peer.close(GatewayCode.INVALID_SEQ, "INVALID_SEQ");
         return;
      }

      log("shared:websocket", "default", "resuming", "sid:", oldSession.sessionId, "seq:", lastSequence);

      const user = await prisma.user.getById(userId, { select: selectPrivateUser });

      oldSession.peer = session.peer;
      oldSession.peer.context.sessionId = oldSession.sessionId;
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
         if (seq <= lastSequence) {
            continue;
         }

         oldSession.send(_data, false, false);
      }

      return { oldSession, user };
   }

   public deleteSession(sessionId: Snowflake) {
      log("shared:websocket", "default", "delete session", "sid:", sessionId);
      this.sessions.delete(sessionId);
   }

   private createSession(peer: Peer, sessionId: Snowflake) {
      log("shared:websocket", "default", "create session", "sid:", sessionId);

      const session = new this.clientSessionConstructor(peer, sessionId);
      this.sessions.set(sessionId, session);

      return session;
   }

   // public send(peer: Peer, data: Payload) {
   //    peer.send(JSON.stringify(data));
   // }
}
