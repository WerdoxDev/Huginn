/* eslint-disable @typescript-eslint/unbound-method */
import {
   GatewayDispatch,
   GatewayEvents,
   GatewayHeartbeat,
   GatewayHello,
   GatewayIdentify,
   GatewayOperations,
   GatewayReadyDispatchData,
   GatewayResume,
} from "@shared/gateway-types";
import { Snowflake } from "@shared/snowflake";
import { isOpcode } from "@shared/utils";
import EventEmitter from "eventemitter3";
import { HuginnClient } from "..";
import { GatewayOptions } from "../types";
import { DefaultGatewayOptions } from "./constants";

export class Gateway {
   public readonly options: GatewayOptions;
   private readonly client: HuginnClient;
   private emitter = new EventEmitter();

   private socket?: WebSocket;
   private heartbeatInterval?: ReturnType<typeof setTimeout>;
   private sequence?: number;
   private sessionId?: Snowflake;

   private emit<EventName extends keyof GatewayEvents>(eventName: EventName, eventArg: GatewayEvents[EventName]): void {
      this.emitter.emit(eventName, eventArg);
   }

   on<EventName extends keyof GatewayEvents>(eventName: EventName, handler: (eventArg: GatewayEvents[EventName]) => void): void {
      this.emitter.on(eventName, handler);
   }

   off<EventName extends keyof GatewayEvents>(eventName: EventName, handler: (eventArg: GatewayEvents[EventName]) => void): void {
      this.emitter.off(eventName, handler);
   }

   public constructor(client: HuginnClient, options: Partial<GatewayOptions> = {}) {
      this.options = { ...DefaultGatewayOptions, ...options };
      this.client = client;
   }

   public connect(): void {
      if (!this.client.isLoggedIn) {
         throw new Error("Trying to connect gateway before client initialization!");
      }

      this.socket = this.options.createSocket(this.options.url);
      this.startListening();
   }

   private startListening() {
      this.socket?.removeEventListener("open", this.onOpen);
      this.socket?.removeEventListener("close", this.onClose);
      this.socket?.removeEventListener("message", this.onMessage);

      this.socket?.addEventListener("open", this.onOpen.bind(this));
      this.socket?.addEventListener("close", this.onClose.bind(this));
      this.socket?.addEventListener("message", this.onMessage.bind(this));
   }

   private onOpen(_e: Event) {
      if (this.options.log) {
         console.log("Gateway Connected!");
      }
   }

   private onClose(e: CloseEvent) {
      if (this.options.log) {
         console.log(`Gateway Closed with code: ${e.code}`);
      }
      this.stopHeartbeat();
      this.emit("close", e.code);

      if (e.code === 1000) {
         return;
      }

      setTimeout(() => {
         this.connect();
      }, 1000);
   }

   private onMessage(e: MessageEvent) {
      if (typeof e.data !== "string") {
         console.error("Non string messages are not yet supported");
         return;
      }

      const data = JSON.parse(e.data);

      // Hello
      if (isOpcode<GatewayHello>(data, GatewayOperations.HELLO)) {
         if (this.options.identify) {
            this.handleHello(data);
         } else {
            this.emit("hello", data.d);
         }
         // Dispatch
      } else if (isOpcode<GatewayDispatch>(data, GatewayOperations.DISPATCH)) {
         this.sequence = data.s;

         if (data.t === "ready") {
            this.sessionId = (data.d as GatewayReadyDispatchData).sessionId;
         }

         this.emit(data.t, data.d);
      }
   }

   public close(): void {
      this.socket?.close(1000);
      this.sequence = undefined;
      this.sessionId = undefined;
   }

   private handleHello(data: GatewayHello) {
      this.startHeartbeat(data.d.heartbeatInterval);

      if (!this.sequence) {
         const identifyData: GatewayIdentify = {
            op: GatewayOperations.IDENTIFY,
            d: {
               token: this.client.tokenHandler.token!,
               intents: this.client.options.intents,
               properties: { os: "windows", browser: "idk", device: "idk" },
            },
         };

         this.send(identifyData);
      } else {
         const resumeData: GatewayResume = {
            op: GatewayOperations.RESUME,
            d: {
               token: this.client.tokenHandler.token!,
               seq: this.sequence,
               sessionId: this.sessionId!,
            },
         };

         this.send(resumeData);
      }
   }

   private startHeartbeat(interval: number) {
      this.heartbeatInterval = setInterval(() => {
         const data: GatewayHeartbeat = { op: GatewayOperations.HEARTBEAT, d: this.sequence ?? null };
         if (this.options.log) {
            console.log("Sending Heartbeat");
         }
         this.send(data);
      }, interval);
   }

   private stopHeartbeat() {
      clearInterval(this.heartbeatInterval);
   }

   public send(data: unknown): void {
      this.socket?.send(JSON.stringify(data));
   }
}
