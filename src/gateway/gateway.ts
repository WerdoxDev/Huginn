import { GatewayHeartbeat, GatewayHello, GatewayIdentify, GatewayOperations, GatewayOptions } from "@shared/gateway-types";
import { HuginnClient } from "..";
import { DefaultGatewayOptions } from "../gateway/constants";
import { isHelloOpcode } from "./utils";

export class Gateway {
   public readonly options: GatewayOptions;
   private readonly client: HuginnClient;

   private socket?: WebSocket;
   private heartbeatInterval?: Timer;
   private sequence: number | null;

   public constructor(client: HuginnClient, options: Partial<GatewayOptions> = {}) {
      this.options = { ...DefaultGatewayOptions, ...options };
      this.client = client;

      this.sequence = null;
   }

   public connect() {
      if (!this.client.isLoggedIn) {
         console.error("Trying to connect gateway before client initialization!");
         return;
      }

      this.socket = this.options.createSocket(this.options.url);
      this.sequence = null;

      this.startListening();
   }

   startListening() {
      this.socket?.addEventListener("open", (_e) => {
         console.log("Gateway Connected!");
      });

      this.socket?.addEventListener("close", (_e) => {
         console.log("Gateway Closed!");
         this.stopHeartbeat();
      });

      this.socket?.addEventListener("message", (e) => {
         if (typeof e.data !== "string") {
            console.error("Non string messages are not yet supported");
            return;
         }

         const data = JSON.parse(e.data);

         if (isHelloOpcode(data)) {
            this.handleHello(data);
         }
      });
   }

   private handleHello(data: GatewayHello) {
      this.startHeartbeat(data.d.heartbeatInterval);

      const identifyData: GatewayIdentify = {
         op: GatewayOperations.IDENTIFY,
         d: {
            token: this.client.tokenHandler.token!,
            intents: this.client.options.intents,
            properties: { os: "windows", browser: "idk", device: "idk" },
         },
      };

      this.send(identifyData);
   }

   private startHeartbeat(interval: number) {
      this.heartbeatInterval = setInterval(() => {
         const data: GatewayHeartbeat = { op: GatewayOperations.HEARTBEAT, d: this.sequence };
         this.send(data);
      }, interval);
   }

   private stopHeartbeat() {
      clearInterval(this.heartbeatInterval);
   }

   private send(data: unknown) {
      this.socket?.send(JSON.stringify(data));
   }
}
