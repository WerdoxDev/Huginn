import type { APIUser, HMediaKind, MediasoupAppData, Snowflake } from "@huginn/shared";
import type { Consumer, Producer, Router, Transport } from "mediasoup/node/lib/types";

export type ClientSessionInfo = {
	token: string;
	channelId: Snowflake;
	guildId: Snowflake | null;
	user: APIUser;
};

export type RTCPeer = {
	id: string;
	userId: Snowflake;
	transports: Map<string, { transport: Transport; direction: "send" | "recv" }>;
	producers: Map<string, Producer<MediasoupAppData>>;
	consumers: Map<string, Consumer<MediasoupAppData>>;
};

export type RouterType = {
	channelId: string;
	router: Router;
	peers: Map<string, RTCPeer>;
};
