import {
	GatewayCode,
	type Snowflake,
	type VoiceHeartbeat,
	type VoiceHello,
	type VoiceIdentify,
	VoiceOperations,
	type VoicePayload,
} from "@huginn/shared";
import type { HuginnClient } from "./huginn-client";
import type { VoiceOptions } from "./types";
import { defaultClientOptions } from "./utils";

export class Voice {
	public socket?: WebSocket;
	private options: VoiceOptions;
	private client: HuginnClient;
	private heartbeatInterval?: ReturnType<typeof setInterval>;
	private sequence?: number;
	private token?: string;

	public constructor(client: HuginnClient, options?: Partial<VoiceOptions>) {
		this.options = { ...defaultClientOptions.voice, ...options };
		this.client = client;
	}

	public connect(token: string): void {
		this.socket = this.options.createSocket(this.options.url);
		this.token = token;
		this.startListening();
	}

	public close(): void {
		this.socket?.close(GatewayCode.INTENTIONAL_CLOSE);
		this.sequence = undefined;
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
				const hello = data as VoiceHello;
				await this.handleHello(hello);
				break;
			}
			case VoiceOperations.READY:
		}
	}

	private async handleHello(data: VoiceHello) {
		this.startHeartbeat(data.d.heartbeatInterval);

		if (!this.client.user || !this.token) {
			throw new Error("Client user or token was null when identifying voice websocket");
		}

		const identifyData: VoiceIdentify = {
			op: VoiceOperations.IDENTIFY,
			d: {
				token: this.token,
				userId: this.client.user.id as Snowflake,
			},
		};

		this.send(identifyData);
	}

	private startHeartbeat(interval: number) {
		this.heartbeatInterval = setInterval(() => {
			const data: VoiceHeartbeat = { op: VoiceOperations.HEARTBEAT, d: this.sequence };
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
