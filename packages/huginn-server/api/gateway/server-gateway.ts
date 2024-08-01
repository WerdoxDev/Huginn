import { constants } from "@huginn/shared";
import { GatewayCode } from "@huginn/shared";
import {
   BasePayload,
   GatewayHeartbeat,
   GatewayHeartbeatAck,
   GatewayHello,
   GatewayIdentify,
   GatewayOperations,
   GatewayReadyDispatch,
   GatewayResume,
   GatewayResumed,
} from "@huginn/shared";
import { Snowflake, snowflake } from "@huginn/shared";
import { idFix, isOpcode } from "@huginn/shared";
import { ServerWebSocket } from "bun";
import consola from "consola";
import { prisma } from "../db";
import { verifyToken } from "../factory/token-factory";
import { logGatewayClose, logGatewayOpen, logGatewayRecieve, logGatewaySend, logServerError } from "../log-utils";
import { ServerGatewayOptions } from "../types";
import { ClientSession } from "./client-session";
import { validateGatewayData } from "./gateway-utils";

export class ServerGateway {
   private readonly options: ServerGatewayOptions;
   private clients: Map<string, ClientSession>;
   private cancelledClientDisconnects: string[];

   public constructor(options: ServerGatewayOptions) {
      this.options = options;
      this.clients = new Map<string, ClientSession>();
      this.cancelledClientDisconnects = [];
   }

   public onOpen(ws: ServerWebSocket<string>) {
      try {
         logGatewayOpen();

         const helloData: GatewayHello = { op: GatewayOperations.HELLO, d: { heartbeatInterval: constants.HEARTBEAT_INTERVAL } };
         this.send(ws, helloData);
      } catch (e) {
         ws.close(GatewayCode.UNKNOWN, "UNKNOWN");
      }
   }

   public onClose(ws: ServerWebSocket<string>, code: number, reason: string) {
      this.clients.get(ws.data)?.dispose();

      if (code === GatewayCode.INVALID_SESSION) {
         this.clients.delete(ws.data);
      } else {
         this.queueClientDisconnect(ws.data);
      }
      logGatewayClose(code, reason);
   }

   public async onMessage(ws: ServerWebSocket<string>, message: string | Buffer) {
      try {
         if (typeof message !== "string") {
            consola.error("Non string message type is not supported yet");
            return;
         }

         const data = JSON.parse(message);

         if (!validateGatewayData(data)) {
            ws.close(GatewayCode.DECODE_ERROR, "DECODE_ERROR");
            return;
         }

         logGatewayRecieve(data, this.options.logHeartbeat);

         // Identify
         if (isOpcode<GatewayIdentify>(data, GatewayOperations.IDENTIFY)) {
            await this.handleIdentify(ws, data);
            // Resume
         } else if (isOpcode<GatewayResume>(data, GatewayOperations.RESUME)) {
            this.handleResume(ws, data);
            // Not authenticated
         } else if (!ws.data) {
            ws.close(GatewayCode.NOT_AUTHENTICATED, "NOT_AUTHENTICATED");
            return;
            // Heartbeat
         } else if (isOpcode<GatewayHeartbeat>(data, GatewayOperations.HEARTBEAT)) {
            this.handleHeartbeat(ws, data);
         } else {
            ws.close(GatewayCode.UNKNOWN_OPCODE, "UNKNOWN_OPCODE");
         }
      } catch (e) {
         if (e instanceof SyntaxError) {
            ws.close(GatewayCode.DECODE_ERROR, "DECODE_ERROR");
            return;
         }

         logServerError("/gateway", e);
         ws.close(GatewayCode.UNKNOWN, "UNKNOWN");
      }
   }

   public getSession(userId: string) {
      return this.clients.get(userId);
   }

   public sendToTopic(topic: string, data: BasePayload) {
      for (const client of this.clients.values()) {
         if (client.isSubscribed(topic)) {
            const newData = { ...data, s: client.increaseSequence() };
            client.addMessage(newData);
            client.ws.send(JSON.stringify(newData));
         }
      }
   }

   private handleHeartbeat(ws: ServerWebSocket<string>, data: GatewayHeartbeat) {
      const client = this.clients.get(ws.data);

      if (data.d !== client?.sequence) {
         ws.close(GatewayCode.INVALID_SEQ, "INVALID_SEQ");
         return;
      }

      this.clients.get(ws.data)?.resetTimeout();
      const hearbeatAckData: GatewayHeartbeatAck = { op: GatewayOperations.HEARTBEAT_ACK };
      this.send(ws, hearbeatAckData);
   }

   private async handleIdentify(ws: ServerWebSocket<string>, data: GatewayIdentify) {
      const { valid, payload } = await verifyToken(data.d.token);

      if (!valid || !payload) {
         ws.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
         return;
      }

      if (this.clients.has(ws.data)) {
         ws.close(GatewayCode.ALREADY_AUTHENTICATED, "ALREADY_AUTHENTICATED");
         return;
      }

      const user = idFix(await prisma.user.getById(payload.id));
      const sessionId = snowflake.generateString();

      ws.data = sessionId;

      const client = new ClientSession(ws, { user, sessionId });
      client.initialize();
      this.clients.set(sessionId, client);

      const readyData: GatewayReadyDispatch = {
         op: GatewayOperations.DISPATCH,
         d: { user, sessionId: sessionId },
         t: "ready",
         s: client.increaseSequence(),
      };

      this.send(ws, readyData);
   }

   private async handleResume(ws: ServerWebSocket<string>, data: GatewayResume) {
      const { valid, payload } = await verifyToken(data.d.token);

      if (!valid || !payload) {
         ws.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
         return;
      }

      if (!this.clients.has(data.d.sessionId)) {
         ws.close(GatewayCode.INVALID_SESSION, "INVALID_SESSION");
         return;
      }

      const client = this.clients.get(data.d.sessionId);

      if (!client) throw new Error("client was null in handleIdentify");

      if (!client.sequence || data.d.seq > client.sequence) {
         ws.close(GatewayCode.INVALID_SEQ, "INVALID_SEQ");
         return;
      }

      ws.data = data.d.sessionId;
      client.ws = ws;
      client.initialize();

      this.cancelledClientDisconnects.push(data.d.sessionId);

      const messageQueue = client.getMessages();

      for (const [seq, _data] of messageQueue) {
         if (seq <= data.d.seq) {
            continue;
         }

         this.send(client.ws, _data);
      }

      const resumedData: GatewayResumed = { t: "resumed", op: GatewayOperations.DISPATCH, d: undefined, s: client.increaseSequence() };
      this.send(client.ws, resumedData);
   }

   private queueClientDisconnect(sessionId: Snowflake) {
      setTimeout(() => {
         if (this.cancelledClientDisconnects.includes(sessionId)) {
            return;
         }

         this.clients.delete(sessionId);
      }, 1000 * 30);
   }

   private send(ws: ServerWebSocket<string>, data: unknown) {
      logGatewaySend(data as BasePayload, this.options.logHeartbeat);

      ws.send(JSON.stringify(data));
   }
}
