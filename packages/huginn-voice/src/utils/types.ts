import type { APIUser, MediasoupAppData, Snowflake } from "@huginnjs/shared";
import type { Consumer, Producer, Router, Transport, WebRtcTransport } from "mediasoup/types";

export type ClientSessionProperties = {
   token: string;
   channelId: Snowflake;
   guildId: Snowflake | null;
   user: APIUser;
};

export type RTCPeer = {
   sessionId: Snowflake;
   userId: Snowflake;
   transports: Map<string, { transport: WebRtcTransport; direction: "send" | "recv" }>;
   producers: Map<string, Producer<MediasoupAppData>>;
   consumers: Map<string, Consumer<MediasoupAppData>>;
};

export type RouterData = {
   channelId: string;
   router: Router;
   peers: Map<Snowflake, RTCPeer>;
};
