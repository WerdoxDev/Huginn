import { error, GatewayCode, idFix, log, type Snowflake, snowflake, validateGatewayData } from "@huginn/shared";
import type { Message, Peer } from "crossws";
import { prisma } from "#database";
import { selectPrivateUser } from "#database/common";
import type { WebsocketOptions } from "#types";
import type { CommonClientSession } from "./common-client-session";

type ClientSessionConstructor<T> = new (peer: Peer, sessionId: Snowflake) => T;

export abstract class CommonWebsocket<ClientSession extends CommonClientSession<Payload, unknown>, Payload> {
   public sessions: Map<Snowflake, ClientSession>;

   private clientSessionConstructor: ClientSessionConstructor<ClientSession>;
   private options: WebsocketOptions;
   // private clientSessionClass: new () => ClientSession;

   public abstract onOpen(session: ClientSession): Promise<void> | void;
   public abstract onClose(session: ClientSession, event: { code?: number, reason?: string }): Promise<void> | void;
   public abstract onMessage(session: ClientSession, data: Payload): Promise<void> | void;

   public constructor(options: WebsocketOptions, clientSessionConstructor: ClientSessionConstructor<ClientSession>) {
      this.options = options;
      this.clientSessionConstructor = clientSessionConstructor;

      this.sessions = new Map();
   }

   public async _internalOnOpen(peer: Peer) {
      const sessionId = snowflake.generateString(this.options.workerId);

      peer.context.sessionId = sessionId;
      const session = this.createSession(peer, sessionId)

      await this.onOpen(session);
   }

   public async _internalOnClose(peer: Peer, event: { code?: number, reason?: string }) {
      const session = this.sessions.get(peer.context.sessionId);

      if (!session) {
         return;
      }

      await this.onClose(session, event);

      session.stopHeartbeatTimeout();

      if (session.authenticated && event.code === GatewayCode.INVALID_SESSION) {
         this.deleteSession(session.sessionId);
      } else if (session.authenticated) {
         session.isStale = true;
         this.queueSessionDelete(session.sessionId)
      } else {
         this.deleteSession(session.sessionId)
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

         await this.onMessage(session, data);
      } catch (e) {
         error("shared:websocket", e);
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

   public getSessionBySessionId(sessionId: string) {
      for (const session of this.sessions.values()) {
         if (session.sessionId === sessionId) {
            return session;
         }
      }
      return undefined;
   }

   public sendToTopic(topic: string, data: Payload) {
      for (const session of this.sessions.values()) {
         if (session.isSubscribed(topic)) {
            const newData = { ...data, s: session.getIncreasedSequence() };
            session.addMessage(newData.s, newData);
            this.send(session.peer, newData);
         }
      }
   }

   private queueSessionDelete(sessionId: Snowflake) {
      log("shared:websocket", "default", "queue session delete", "wid:", this.options.workerId, "sid:", sessionId)

      setTimeout(() => {
         const session = this.sessions.get(sessionId);

         if (session && !session.isStale) {
            return;
         }

         this.deleteSession(sessionId);
      }, this.options.sessionDeleteTimeout)
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

      const user = idFix(await prisma.user.getById(userId, { select: selectPrivateUser }));

      oldSession.peer = session.peer;
      oldSession.peer.context.sessionId = oldSession.sessionId;
      oldSession.isStale = false;
      await oldSession.initialize(user, { ...oldSession.properties });

      // This session is initialized for the peer right at connection. We need to delete it.
      session.stopHeartbeatTimeout();
      this.deleteSession(session.sessionId);

      const messageQueue = oldSession.getMessages();

      for (const [seq, _data] of messageQueue) {
         if (seq <= lastSequence) {
            continue;
         }

         this.send(oldSession.peer, _data);
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
      this.sessions.set(sessionId, session)

      return session;
   }

   public send(peer: Peer, data: unknown) {
      peer.send(JSON.stringify(data));
   }
}
