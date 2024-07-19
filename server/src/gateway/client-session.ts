import { constants } from "@shared/constants";
import { GatewayCode } from "@shared/errors";
import { BasePayload } from "@shared/gateway-types";
import { idFix } from "@shared/utils";
import { ServerWebSocket } from "bun";
import { EventEmitter } from "node:events";
import { prisma } from "../db";
import { ClientSessionInfo } from "../types";

export class ClientSession extends EventEmitter {
   public data: ClientSessionInfo;
   public ws: ServerWebSocket<string>;

   private sentMessages: Map<number, BasePayload>;
   private subscribedTopics: Set<string>;
   private hearbeatTimeout?: Timer;
   public sequence?: number;

   public constructor(ws: ServerWebSocket<string>, data: ClientSessionInfo) {
      super();

      this.ws = ws;
      this.data = data;
      this.sentMessages = new Map();
      this.subscribedTopics = new Set();
   }

   public initialize() {
      this.subscribeClientEvents();
      this.startHeartbeatTimeout();
   }

   public resetTimeout() {
      clearTimeout(this.hearbeatTimeout);
      this.startHeartbeatTimeout();
   }

   public dispose() {
      clearTimeout(this.hearbeatTimeout);
      this.removeAllListeners();
   }

   public subscribe(topic: string) {
      if (!this.ws.isSubscribed(topic)) {
         this.ws.subscribe(topic);
         this.subscribedTopics.add(topic);
      }
   }

   public unsubscribe(topic: string) {
      if (this.ws.isSubscribed(topic)) {
         this.ws.unsubscribe(topic);
         this.subscribedTopics.delete(topic);
      }
   }

   public isSubscribed(topic: string) {
      return this.subscribedTopics.has(topic);
   }

   public increaseSequence() {
      this.sequence = this.sequence !== undefined ? this.sequence + 1 : 0;
      return this.sequence;
   }

   public addMessage(data: BasePayload) {
      this.sentMessages.set(data.s, data);
   }

   public getMessages() {
      return this.sentMessages;
   }

   private async subscribeClientEvents() {
      this.subscribe(this.data.user.id);

      const clientChannels = idFix(await prisma.channel.getUserChannels(this.data.user.id, true));

      for (const channel of clientChannels) {
         this.subscribe(channel.id);
      }
   }

   private startHeartbeatTimeout() {
      const tolerance = 3000;

      this.hearbeatTimeout = setTimeout(() => {
         this.emit("timeout", this.data);
         this.dispose();
         this.ws.close(GatewayCode.SESSION_TIMEOUT, "SESSION_TIMEOUT");
      }, constants.HEARTBEAT_INTERVAL + tolerance);
   }
}
