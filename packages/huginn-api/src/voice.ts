import type { GatewayPayload } from "@huginn/shared";
import type { HuginnClient } from "./huginn-client";
import type { VoiceOptions } from "./types";
import { defaultClientOptions } from "./utils";

export class Voice {
	public socket?: WebSocket;
	private options: VoiceOptions;
	private client: HuginnClient;

	public constructor(client: HuginnClient, options: Partial<VoiceOptions>) {
		this.options = { ...defaultClientOptions.voice, ...options };
		this.client = client;
	}

	public connect(): void {
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
		console.log("Connected to voice");
	}

	private onClose(e: CloseEvent) {
		console.log("Closed", e.code, e.reason);
	}

	private onMessage(e: MessageEvent) {
		const data: GatewayPayload = JSON.parse(e.data);
	}
}
