import type { Peer } from "crossws";

import { analytics, type APIUser, CONSTANTS, GatewayCode, recordSpanError, type Snowflake, WorkerID } from "@huginn/shared";

import type { CommonPayload } from "#types";

export abstract class CommonClientSession<Payload extends CommonPayload, Properties = undefined> {
   public sessionId: Snowflake;
   public peer: Peer;
   public properties?: Properties;
   public user?: APIUser;

   public isStale = false;
   public sequence?: number;
   private workerId: WorkerID;

   private heartbeatTimeout?: NodeJS.Timeout;
   private sentMessages: Map<number, Payload>;
   private queue: Promise<void> = Promise.resolve();
   private sentMessagesLimit: number;

   public get authenticated() {
      return !!this.user;
   }

   public constructor(peer: Peer, sessionId: Snowflake, workerId: WorkerID, sentMessagesLimit: number) {
      this.peer = peer;
      this.sessionId = sessionId;
      this.workerId = workerId;
      this.sentMessagesLimit = sentMessagesLimit;
      this.sentMessages = new Map();

      this.resetHeartbeatTimeout();
   }

   public send(data: Payload, increaseSequence: boolean, resumable: boolean) {
      if (increaseSequence) data.s = this.getIncreasedSequence();
      if (resumable && data.s) {
         if (this.sentMessages.size >= this.sentMessagesLimit) {
            const firstKey = this.sentMessages.keys().next().value;
            if (firstKey !== undefined) this.sentMessages.delete(firstKey);
         }

         this.sentMessages.set(data.s, data);
      }

      this.peer.send(JSON.stringify(data));
   }

   public async initialize(user: APIUser, properties: Properties) {
      return await analytics.startActiveSpan("commonClientSession.initialize", async (span) => {
         span.setAttributes({ ...this.getDefaultAttributes(), "user.id": user.id });
         try {
            this.user = user;
            this.properties = properties;

            await this.subscribeToTopics();
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public subscribe(topic: string) {
      this.peer.subscribe(topic);
   }

   public unsubscribe(topic: string) {
      this.peer.unsubscribe(topic);
   }

   public isSubscribed(topic: string) {
      return this.peer.topics.has(topic);
   }

   public getSubscriptions() {
      return this.peer.topics;
   }

   public getIncreasedSequence() {
      this.sequence = this.sequence !== undefined ? this.sequence + 1 : 0;
      return this.sequence;
   }

   public getMessages() {
      return this.sentMessages;
   }

   public stopHeartbeatTimeout() {
      if (this.heartbeatTimeout) {
         clearTimeout(this.heartbeatTimeout);
      }
   }

   public resetHeartbeatTimeout() {
      this.stopHeartbeatTimeout();

      this.heartbeatTimeout = setTimeout(() => {
         this.peer.close(GatewayCode.SESSION_TIMEOUT, "SESSION_TIMEOUT");
         this.stopHeartbeatTimeout();
      }, CONSTANTS.HEARTBEAT_INTERVAL + CONSTANTS.HEARTBEAT_TOLERANCE);
   }

   public async subscribeToTopics() {
      if (!this.authenticated || !this.user) {
         return;
      }

      const userId = this.user.id;
      this.subscribe(this.peer.id);
      this.subscribe(this.sessionId);
      this.subscribe(userId);
   }

   public enqueue(fn: () => Promise<void> | void, onError?: (e: any) => void) {
      const result = this.queue.then(() => fn());
      this.queue = result.catch((e) => {
         onError?.(e);
      });

      return result;
   }

   public getDefaultAttributes(prefix = "session") {
      return {
         [`${prefix}.id`]: this.sessionId,
         [`${prefix}.peer.id`]: this.peer.id,
         [`${prefix}.user.id`]: this.user?.id ?? "null",
         [`${prefix}.worker_id`]: this.workerId,
         [`${prefix}.sequence`]: this.sequence !== undefined ? this.sequence : "null",
         [`${prefix}.is_authenticated`]: this.authenticated,
         [`${prefix}.is_stale`]: this.isStale,
      };
   }
}
