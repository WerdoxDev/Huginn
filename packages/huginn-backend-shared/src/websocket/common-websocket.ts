import type { Message, Peer } from "crossws";

import { analytics, GatewayCode, recordSpanError, type Snowflake, snowflake, validateGatewayData } from "@huginnjs/shared";

import type { CommonPayload, WebsocketOptions } from "#types";

import { prisma, selectPrivateUser } from "#database";

import type { CommonClientSession } from "./common-client-session";

type ClientSessionConstructor<T> = new (peer: Peer, sessionId: Snowflake, sentMessagesLimit: number) => T;

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
      analytics.startActiveSpan("commonWebsocket.onOpen", async (span) => {
         span.setAttribute("params.peer.id", peer.id);
         try {
            const sessionId = snowflake.generateString(this.options.workerId);

            peer.context.sessionId = sessionId;
            const session = this.createSession(peer, sessionId, this.options.sessionSentMessagesLimit);
            span.setAttributes(session.getDefaultAttributes());

            await session.enqueue(() => this.onOpen(session));
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async _internalOnClose(peer: Peer, event: { code?: number; reason?: string }) {
      analytics.startActiveSpan("commonWebsocket.onClose", async (span) => {
         span.setAttribute("params.peer.id", peer.id);
         if (event.code) span.setAttribute("params.event.code", event.code);
         if (event.reason) span.setAttribute("params.event.reason", event.reason);
         try {
            const session = this.sessions.get(peer.context.sessionId);
            span.setAttribute("session.exists", !!session);
            if (!session) return;
            else span.setAttributes(session.getDefaultAttributes());

            await session.enqueue(() => this.onClose(session, event));

            session.stopHeartbeatTimeout();

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
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async _internalOnMessage(peer: Peer, message: Message) {
      // return await analytics.startActiveSpan("commonWebsocket.onMessage", async (span) => {
      // span.setAttribute("params.peer.id", peer.id);
      try {
         const data: Payload = message.json();

         if (!validateGatewayData(data)) {
            peer.close(GatewayCode.DECODE_ERROR, "DECODE_ERROR");
            return;
         }

         const session = this.sessions.get(peer.context.sessionId);
         // span.setAttribute("session.exists", !!session);
         if (!session) return;
         // else span.setAttributes(session.getDefaultAttributes());

         await session.enqueue(async () => await this.onMessage(session, data));
         // oxlint-disable-next-line no-unused-vars
      } catch (e) {
         // recordSpanError(e);
         if (e instanceof SyntaxError) {
            peer.close(GatewayCode.DECODE_ERROR, "DECODE_ERROR");
            return;
         }

         peer.close(GatewayCode.UNKNOWN, "UNKNOWN");
      }
      // } finally {
      // span.end();
      // }
      // });
   }

   public subscribeSessionsToTopic(userId: Snowflake, topic: string) {
      for (const [_sessionId, session] of this.sessions) {
         if (session.user?.id === userId) {
            session.subscribe(topic);
         }
      }
   }

   public unsubscribeSessionsFromTopic(userId: Snowflake, topic: string) {
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
      return analytics.startActiveSpan("commonWebsocket.queueSessionDelete", (span) => {
         span.setAttribute("params.session.id", sessionId);
         try {
            const timeout = setTimeout(async () => {
               const session = this.sessions.get(sessionId);
               if (!session || !session.isStale) return;

               this.deleteSession(sessionId);
            }, this.options.sessionDeleteTimeout);

            if (this.sessionDeleteTimeouts.has(sessionId)) {
               this.cancelSessionDelete(sessionId);
            }

            this.sessionDeleteTimeouts.set(sessionId, timeout);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public cancelSessionDelete(sessionId: Snowflake) {
      return analytics.startActiveSpan("commonWebsocket.cancelSessionDelete", (span) => {
         span.setAttribute("params.session.id", sessionId);
         try {
            const exists = this.sessionDeleteTimeouts.has(sessionId);
            span.setAttribute("session_delete_timeout.exists", exists);
            if (exists) {
               const timeout = this.sessionDeleteTimeouts.get(sessionId);
               clearTimeout(timeout);
               this.sessionDeleteTimeouts.delete(sessionId);
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async resumeSession(session: ClientSession, oldSessionId: Snowflake, lastSequence: number, userId: Snowflake) {
      return await analytics.startActiveSpan("commonWebsocket.resumeSession", async (span) => {
         span.setAttributes({
            ...session.getDefaultAttributes(),
            "params.old_session.id": oldSessionId,
            "params.last_sequence": lastSequence,
            "params.user.id": userId,
         });
         try {
            const oldSession = this.sessions.get(oldSessionId);

            span.setAttribute("old_session.exists", !!oldSession);
            if (oldSession) span.setAttributes(oldSession.getDefaultAttributes("old_session"));

            if (!oldSession || !oldSession.authenticated || !oldSession.properties) {
               session.peer.close(GatewayCode.INVALID_SESSION, "INVALID_SESSION");
               return;
            }

            if (oldSession.sequence === undefined || lastSequence > oldSession.sequence) {
               session.peer.close(GatewayCode.INVALID_SEQ, "INVALID_SEQ");
               return;
            }

            // Sometimes the new session reconnects so fast that the old one is still actually not considered as "disconnected" from the server
            // if (oldSession.peer.websocket.readyState === WebSocket.OPEN) {
            //    oldSession.peer.close(GatewayCode.SWITCHING_CONNECTION, "SWITCHING_CONNECTION");
            // }

            const user = await prisma.user.getById(userId, { select: selectPrivateUser });
            span.setAttribute("user.id", user.id);

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
            span.setAttribute("old_session.message_queue.size", messageQueue.size);

            const missedMessageCount = oldSession.sequence - lastSequence;
            span.setAttribute("old_session.message_queue.missed_message_count", missedMessageCount);

            if (messageQueue.size < missedMessageCount) {
               session.peer.close(GatewayCode.INVALID_SEQ, "INVALID_SEQ");
               return;
            }

            let resendCount = 0;
            for (const [seq, _data] of messageQueue) {
               if (seq <= lastSequence) continue;

               oldSession.send(_data, false, false);
               resendCount++;
            }
            span.setAttribute("old_session.message_queue.resend_count", resendCount);

            return { oldSession, user };
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async deleteSession(sessionId: Snowflake) {
      return await analytics.startActiveSpan("commonWebsocket.deleteSession", async (span) => {
         span.setAttribute("params.session.id", sessionId);
         try {
            const session = this.sessions.get(sessionId);
            span.setAttribute("session.exists", !!session);

            if (session) {
               span.setAttributes(session.getDefaultAttributes());
               await this.onDeleteSession?.(session);
               this.sessions.delete(sessionId);
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   private createSession(peer: Peer, sessionId: Snowflake, sentMessagesLimit: number) {
      return analytics.startActiveSpan("commonWebsocket.createSession", (span) => {
         span.setAttributes({ "params.session.id": sessionId, "params.peer.id": peer.id });
         try {
            const session = new this.clientSessionConstructor(peer, sessionId, sentMessagesLimit);
            span.setAttributes(session.getDefaultAttributes());
            this.sessions.set(sessionId, session);

            return session;
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }
}
