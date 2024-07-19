import { GatewayOptions } from "../types";

export const DefaultGatewayOptions: Required<GatewayOptions> = {
   url: "ws://localhost:3000/gateway",
   identify: true,
   log: true,
   createSocket(_url) {
      console.error("createSocket function is not implemented. Please implement it using your own way");
      return {} as WebSocket;
   },
} as const;
