import { GatewayCode, type Snowflake, type VoiceHelloData, VoiceOperations, type VoicePayload, type VoiceReadyData } from "@huginn/shared";
import * as mediasoupClient from "mediasoup-client";
import type { HuginnClient } from "./huginn-client";
import type { VoiceOptions } from "./types";
import { defaultClientOptions } from "./utils";

export class Voice {
	public socket?: WebSocket;
	private options: VoiceOptions;
	private client: HuginnClient;
	private heartbeatInterval?: ReturnType<typeof setInterval>;
	private sequence?: number;

	private connectionInfo?: { token: string; channelId: Snowflake; guildId: Snowflake | null };

	public constructor(client: HuginnClient, options?: Partial<VoiceOptions>) {
		this.options = { ...defaultClientOptions.voice, ...options };
		this.client = client;
	}

	public connect(token: string, channelId: Snowflake, guildId: Snowflake | null): void {
		if (this.socket) {
			return;
		}

		this.socket = this.options.createSocket(this.options.url);
		this.connectionInfo = { token, channelId, guildId };
		this.startListening();
	}

	public close(): void {
		this.socket?.close(GatewayCode.INTENTIONAL_CLOSE);
		this.sequence = undefined;
		this.socket = undefined;
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
			console.log("[Voice] Connected");
		}
	}

	private onClose(e: CloseEvent) {
		if (this.options.log) {
			console.log("[Voice] Closed", e.code, e.reason);
		}

		this.stopHeartbeat();
	}

	private async onMessage(e: MessageEvent) {
		const data: VoicePayload = JSON.parse(e.data);

		switch (data.op) {
			case VoiceOperations.HELLO: {
				const hello = data.d as VoiceHelloData;
				await this.handleHello(hello);
				break;
			}
			case VoiceOperations.READY: {
				const ready = data.d as VoiceReadyData;
				await this.handleReady(ready);
				break;
			}
		}
	}

	private async handleReady(data: VoiceReadyData) {
		if (!this.connectionInfo) {
			return;
		}

		const device = new mediasoupClient.Device();
		await device.load({ routerRtpCapabilities: data.rtpCapabilities });

		const createSendTransportData: VoicePayload<VoiceOperations.CREATE_TRANSPORT> = {
			op: VoiceOperations.CREATE_TRANSPORT,
			d: { channelId: this.connectionInfo?.channelId, direction: "send" },
		};

		const createRecvTransportData: VoicePayload<VoiceOperations.CREATE_TRANSPORT> = {
			op: VoiceOperations.CREATE_TRANSPORT,
			d: { channelId: this.connectionInfo?.channelId, direction: "recv" },
		};

		this.send(createSendTransportData);
		this.send(createRecvTransportData);
	}

	private async handleHello(data: VoiceHelloData) {
		this.startHeartbeat(data.heartbeatInterval);

		if (!this.client.user || !this.connectionInfo) {
			throw new Error("Client user or token was null when identifying voice websocket");
		}

		const identifyData: VoicePayload<VoiceOperations.IDENTIFY> = {
			op: VoiceOperations.IDENTIFY,
			d: {
				token: this.connectionInfo.token,
				channelId: this.connectionInfo.channelId,
				guildId: this.connectionInfo.guildId,
				userId: this.client.user.id as Snowflake,
			},
		};

		this.send(identifyData);
	}

	private startHeartbeat(interval: number) {
		this.heartbeatInterval = setInterval(() => {
			const data: VoicePayload<VoiceOperations.HEARTBEAT> = { op: VoiceOperations.HEARTBEAT, d: this.sequence };
			if (this.options.log) {
				console.log("[Voice] Sending Heartbeat");
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
