import { constants } from "@shared/constants";
import { GatewayCode } from "@shared/errors";
import { ServerWebSocket } from "bun";
import { EventEmitter } from "node:events";
import { ClientSessionInfo } from "../types";
import { prisma } from "../db";
import { idFix } from "@shared/utils";

export class ClientSession extends EventEmitter {
   public data: ClientSessionInfo;
   public ws: ServerWebSocket<string>;

   private hearbeatTimeout?: Timer;

   public constructor(ws: ServerWebSocket<string>, data: ClientSessionInfo) {
      super();

      this.ws = ws;
      this.data = data;

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
      }
   }

   public unsubscribe(topic: string) {
      if (this.ws.isSubscribed(topic)) {
         this.ws.unsubscribe(topic);
      }
   }

   private async subscribeClientEvents() {
      this.ws.subscribe(this.data.user.id);

      const clientChannels = idFix(await prisma.channel.getUserChannels(this.data.user.id, true));

      for (const channel of clientChannels) {
         this.ws.subscribe(channel.id);
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
