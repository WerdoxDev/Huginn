import type { CommonPayload } from "#types";
import { type APIUser, constants, error, GatewayCode, log, type Snowflake } from "@huginn/shared";
import type { Peer } from "crossws";

export abstract class CommonClientSession<Payload extends CommonPayload, Properties = undefined> {
   public sessionId: Snowflake;
   public peer: Peer;
   public properties?: Properties;
   public user?: APIUser;

   public isStale = false;
   public sequence?: number;

   private heartbeatTimeout?: NodeJS.Timeout;
   private sentMessages: Map<number, Payload>;
   private queue: Promise<void> = Promise.resolve();

   public get authenticated() {
      return !!this.user;
   }

   public constructor(peer: Peer, sessionId: Snowflake) {
      this.peer = peer;
      this.sessionId = sessionId;
      this.sentMessages = new Map();

      this.resetHeartbeatTimeout();
   }

   public send(data: Payload, increaseSequence: boolean, resumable: boolean) {
      if (increaseSequence) {
         data.s = this.getIncreasedSequence();
      }

      if (resumable && data.s) {
         this.sentMessages.set(data.s, data);
      }

      this.peer.send(JSON.stringify(data));
   }

   public async initialize(user: APIUser, properties: Properties) {
      log("backend-shared:client-session", "default", "initialize", "uid:", user.id);

      this.user = user;
      this.properties = properties;

      await this.subscribeToTopics();
   }

   public subscribe(topic: string) {
      log("backend-shared:client-session", "subscriptions", "subscribe", topic);

      this.peer.subscribe(topic);
   }

   public unsubscribe(topic: string) {
      log("backend-shared:client-session", "subscriptions", "unsubscribe", topic);

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
      }, constants.HEARTBEAT_INTERVAL + constants.HEARTBEAT_TOLERANCE);
   }

   public async subscribeToTopics() {
      log("backend-shared:client-session", "subscriptions", "subscribe to defaults", "sid:", this.sessionId);

      if (!this.authenticated || !this.user) {
         error("backend-shared:client-session", "Client session is not authenticated");
         return;
      }

      const userId = this.user.id;
      this.subscribe(this.peer.id);
      this.subscribe(this.sessionId);
      this.subscribe(userId);

      await this.subscribeToTopicsExtra();
   }

   public abstract subscribeToTopicsExtra(): Promise<void> | void;

   public enqueue(fn: () => Promise<void> | void, onError?: (e: any) => void) {
      const result = this.queue.then(() => fn());
      this.queue = result.catch((e) => {
         error("backend-shared:client-session", "error in enqueued function: ", e);
         onError?.(e);
      });

      return result;
   }
}
