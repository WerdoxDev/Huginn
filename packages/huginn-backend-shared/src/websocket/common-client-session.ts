import type { Peer } from "crossws";

import { analytics, type APIUser, CONSTANTS, GatewayCode, recordSpanError, type Snowflake, WorkerID } from "@huginnjs/shared";

import type { CommonPayload } from "#types";

export abstract class CommonClientSession<Payload extends CommonPayload, Properties extends Record<string, string | number | boolean> | undefined = undefined> {
   public sessionId: Snowflake;
   public peer: Peer;
   public properties?: Properties;
   public user?: APIUser;

   public connectionEpoch = 0;
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

   /**
    * Transfers ownership of this logical session to a new physical connection.
    * Events from previously attached peers retain the earlier epoch and can
    * therefore be ignored safely.
    */
   public attachPeer(peer: Peer) {
      this.connectionEpoch++;
      this.peer = peer;
      peer.context.sessionId = this.sessionId;
      peer.context.connectionEpoch = this.connectionEpoch;
   }

   public isCurrentConnection(peer: Peer, connectionEpoch: number) {
      return (
         this.peer === peer &&
         this.connectionEpoch === connectionEpoch &&
         peer.context.sessionId === this.sessionId &&
         peer.context.connectionEpoch === connectionEpoch
      );
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
      this.heartbeatTimeout = undefined;
   }

   public resetHeartbeatTimeout() {
      this.stopHeartbeatTimeout();

      const peer = this.peer;
      const connectionEpoch = this.connectionEpoch;
      const timeout = setTimeout(() => {
         if (this.heartbeatTimeout !== timeout || !this.isCurrentConnection(peer, connectionEpoch)) return;

         peer.close(GatewayCode.SESSION_TIMEOUT, "SESSION_TIMEOUT");
         this.stopHeartbeatTimeout();
      }, CONSTANTS.HEARTBEAT_INTERVAL + CONSTANTS.HEARTBEAT_TOLERANCE);
      this.heartbeatTimeout = timeout;
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

   public enqueue<Result>(fn: () => Promise<Result> | Result, onError?: (e: any) => void): Promise<Result> {
      const result = this.queue.then(() => fn());
      this.queue = result.then(
         () => undefined,
         (e) => {
            onError?.(e);
         },
      );

      return result;
   }

   public getDefaultAttributes(prefix = "session") {
      return {
         [`${prefix}.id`]: this.sessionId,
         [`${prefix}.peer.id`]: this.peer.id,
         [`${prefix}.connection_epoch`]: this.connectionEpoch,
         [`${prefix}.user.id`]: this.user?.id ?? "null",
         [`${prefix}.worker_id`]: this.workerId,
         [`${prefix}.sequence`]: this.sequence !== undefined ? this.sequence : "null",
         [`${prefix}.is_authenticated`]: this.authenticated,
         [`${prefix}.is_stale`]: this.isStale,
         ...(this.properties && typeof this.properties === "object"
            ? Object.entries(this.properties).reduce(
                 (acc, [key, value]) => {
                    acc[`${prefix}.properties.${key}`] = value;
                    return acc;
                 },
                 {} as Record<string, string | number | boolean>,
              )
            : {}),
      };
   }
}
