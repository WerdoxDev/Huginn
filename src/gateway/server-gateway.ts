import { constants } from "@shared/constants";
import { GatewayCode } from "@shared/errors";
import {
   BasePayload,
   GatewayDispatchEvents,
   GatewayHeartbeatAck,
   GatewayHello,
   GatewayIdentify,
   GatewayOperations,
   GatewayReadyDispatch,
} from "@shared/gateway-types";
import { snowflake } from "@shared/snowflake";
import { ServerWebSocket } from "bun";
import consola from "consola";
import { ClientSessionInfo, ServerGatewayOptions } from "../types";
import { ClientSession } from "./client-session";
import { prisma } from "../database";
import { verifyToken } from "../factory/token-factory";
import { isHeartbeatOpcode, isIdentifyOpcode } from "./gateway-utils";
import { logGatewayClose, logGatewayOpen, logGatewayRecieve, logGatewaySend } from "../log-utils";
import { idFix } from "@shared/utility";

export class ServerGateway {
   private readonly options: ServerGatewayOptions;
   private clients: Map<string, ClientSession>;

   public constructor(options: ServerGatewayOptions) {
      this.options = options;
      this.clients = new Map<string, ClientSession>();
   }

   public onOpen(ws: ServerWebSocket<string>) {
      logGatewayOpen();

      const helloData: GatewayHello = { op: GatewayOperations.HELLO, d: { heartbeatInterval: constants.HEARTBEAT_INTERVAL } };
      this.send(ws, helloData);
   }

   public onClose(ws: ServerWebSocket<string>, code: number, reason: string) {
      this.clients.get(ws.data)?.dispose();
      this.clients.delete(ws.data);
      logGatewayClose(code, reason);
   }

   public async onMessage(ws: ServerWebSocket<string>, message: string | Buffer) {
      if (typeof message !== "string") {
         consola.error("Non string message type is not supported yet");
         return;
      }

      const data = JSON.parse(message);

      logGatewayRecieve(data, this.options.logHeartbeat);

      if (isHeartbeatOpcode(data)) {
         this.handleHeartbeat(ws);
      }
      if (isIdentifyOpcode(data)) {
         await this.handleIdentify(ws, data);
      }
   }

   public getSession(userId: string) {
      return this.clients.get(userId);
   }

   private handleHeartbeat(ws: ServerWebSocket<string>) {
      this.clients.get(ws.data)?.resetTimeout();
      const hearbeatAckData: GatewayHeartbeatAck = { op: GatewayOperations.HEARTBEAT_ACK };
      this.send(ws, hearbeatAckData);
   }

   private async handleIdentify(ws: ServerWebSocket<string>, data: GatewayIdentify) {
      const { valid, payload } = await verifyToken(data.d.token);

      if (!valid || !payload) {
         ws.close(GatewayCode.AUTHENTICATION_FAILED, "AUTHENTICATION_FAILED");
      }

      const user = idFix(await prisma.user.getById(payload!.id));
      const sessionId = snowflake.generateString();

      const readyData: GatewayReadyDispatch = {
         op: GatewayOperations.DISPATCH,
         d: { user, sessionId: sessionId },
         t: GatewayDispatchEvents.READY,
         s: 0,
      };

      // eslint-disable-next-line no-param-reassign
      ws.data = user.id;

      const client = new ClientSession(ws, { user, sessionId: sessionId });
      this.listenToSessionEvents(client);
      this.clients.set(user.id, client);

      this.send(ws, readyData);
   }

   private listenToSessionEvents(client: ClientSession) {
      client.on("timeout", (info: ClientSessionInfo) => {
         this.clients.delete(info.user.id);
      });
   }

   private send(ws: ServerWebSocket<string>, data: unknown) {
      logGatewaySend(data as BasePayload, this.options.logHeartbeat);

      ws.send(JSON.stringify(data));
   }
}
