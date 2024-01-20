export type GatewayOptions = {
   url: string;
   createSocket(url: string): WebSocket;
};

export enum GatewayOperations {
   DISPATCH = 0,
   HEARTBEAT = 1,
   IDENTIFY = 2,
   HELLO = 10,
   HEARTBEAT_ACK = 11,
}

export enum GatewayDispatchEvents {
   READY = "READY",
   MESSAGE_CREATE = "MESSAGE_CREATE",
   MESSAGE_DELETE = "MESSAGE_DELETE",
   TYPING_START = "TYPING_START",
}

export type BasePayload = {
   op: GatewayOperations;
   d?: unknown;
   s: number;
   t?: string;
};

export type NonDispatchPayload = Omit<BasePayload, "s" | "t">;

export type DataPayload<Event extends GatewayDispatchEvents, D = unknown> = {
   op: GatewayOperations.DISPATCH;
   t: Event;
   d: D;
};

export type GatewayHello = NonDispatchPayload & {
   op: GatewayOperations.HELLO;
   d: GatewayHelloData;
};

export type GatewayHelloData = {
   heartbeatInterval: number;
};

export type GatewayHeartbeat = NonDispatchPayload & {
   op: GatewayOperations.HEARTBEAT;
   d: GatewayHeartbeatData;
};

export type GatewayHeartbeatData = number | null;

export type GatewayHeartbeatAck = NonDispatchPayload & {
   op: GatewayOperations.HEARTBEAT_ACK;
};

export type GatewayIdentify = NonDispatchPayload & {
   op: GatewayOperations.IDENTIFY;
   d: GatewayIdentifyData;
};

export type GatewayIdentifyData = {
   token: string;
   properties: GatewayIdentifyProperties;
   intents: number;
};

export type GatewayIdentifyProperties = {
   os: string;
   browser: string;
   device: string;
};
