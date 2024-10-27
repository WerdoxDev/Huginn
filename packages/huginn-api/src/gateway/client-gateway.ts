import {
	GatewayCode,
	type GatewayDispatch,
	type GatewayEvents,
	type GatewayHeartbeat,
	type GatewayHello,
	type GatewayIdentify,
	GatewayOperations,
	type GatewayReadyDispatchData,
	type GatewayResume,
} from "@huginn/shared";
import type { BasePayload, Snowflake } from "@huginn/shared";
import { isOpcode } from "@huginn/shared";
import type { HuginnClient } from "../../";
import { EventEmitterWithHistory } from "../client/event-emitter";
import { ClientReadyState, type GatewayOptions } from "../types";
import { DefaultGatewayOptions } from "./constants";

export class Gateway {
	public readonly options: GatewayOptions;
	private readonly client: HuginnClient;
	private readonly emitter = new EventEmitterWithHistory();

	public socket?: WebSocket;
	public readyData?: GatewayReadyDispatchData;
	public peerId?: string;

	private receivedHello = false;
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
		this.socket = this.options.createSocket(this.options.url);
		this.startListening();
	}

	public async identify(): Promise<void> {
		let onMessage: ((e: MessageEvent) => void) | undefined = undefined;
		let onClose: (() => void) | undefined = undefined;

		const result = await new Promise((r) => {
			if (!this.sequence) {
				if (this.receivedHello) {
					this.sendIdentify();
					r(true);
				} else {
					onMessage = (e: MessageEvent) => {
						const op = (JSON.parse(e.data) as BasePayload).op;
						if (op === GatewayOperations.HELLO) {
							this.sendIdentify();
							r(true);
						}
					};
					onClose = () => {
						r(false);
					};

					this.socket?.addEventListener("message", onMessage);
					this.socket?.addEventListener("close", onClose);
				}
			}
		});

		if (onMessage && onClose) {
			this.socket?.removeEventListener("message", onMessage);
			this.socket?.removeEventListener("close", onClose);
		}

		if (!result) {
			throw new Error("Gateway closed before identifying.");
		}
	}

	public async waitForReady(): Promise<void> {
		if (this.socket?.readyState !== WebSocket.OPEN) {
			throw new Error("WebSocket is not connected");
		}

		let onMessage: ((e: MessageEvent) => void) | undefined = undefined;
		let onClose: (() => void) | undefined = undefined;

		const result = await new Promise((r) => {
			if (this.client.user) {
				r(true);
			} else {
				onMessage = (e: MessageEvent) => {
					const t = (JSON.parse(e.data) as BasePayload).t;
					if (t === "ready") {
						r(true);
					}
				};
				onClose = () => {
					r(false);
				};

				this.socket?.addEventListener("message", onMessage);
				this.socket?.addEventListener("close", onClose);
			}
		});

		if (onMessage && onClose) {
			this.socket?.removeEventListener("message", onMessage);
			this.socket?.removeEventListener("close", onClose);
		}

		if (!result) {
			throw new Error("Gateway closed before being ready.");
		}
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

		this.emit("open", undefined);
	}

	private onClose(e: CloseEvent) {
		if (this.options.log) {
			console.log(`Gateway Closed with code: ${e.code}`);
		}

		this.stopHeartbeat();
		this.emit("close", e.code);

		this.readyData = undefined;
		this.receivedHello = false;

		if (e.code === 1000) {
			return;
		}

		setTimeout(async () => {
			if (e.code === GatewayCode.INVALID_SESSION) {
				this.sequence = undefined;
				this.sessionId = undefined;
			}

			this.connect();

			if (this.client.readyState === ClientReadyState.READY) {
				await this.identify();
			}
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
			this.handleHello(data);
			this.emit("hello", data.d);
			// Dispatch
		} else if (isOpcode<GatewayDispatch>(data, GatewayOperations.DISPATCH)) {
			this.sequence = data.s;

			if (data.t === "ready") {
				this.handleReady(data.d as GatewayReadyDispatchData);
			}

			this.emit(data.t, data.d);
		}
	}

	public close(): void {
		this.socket?.close(1000);
		this.sequence = undefined;
		this.sessionId = undefined;
		this.receivedHello = false;
	}

	private handleHello(data: GatewayHello) {
		this.receivedHello = true;
		this.peerId = data.d.peerId;
		this.startHeartbeat(data.d.heartbeatInterval);

		if (this.sequence && this.sessionId) {
			const resumeData: GatewayResume = {
				op: GatewayOperations.RESUME,
				d: {
					token: this.client.tokenHandler.token ?? "",
					seq: this.sequence,
					sessionId: this.sessionId ?? "",
				},
			};

			this.send(resumeData);
		}
	}

	private handleReady(data: GatewayReadyDispatchData) {
		this.sessionId = data.sessionId;
		this.client.user = data.user;

		this.readyData = data;

		this.client.readyState = ClientReadyState.READY;
	}

	private sendIdentify() {
		const identifyData: GatewayIdentify = {
			op: GatewayOperations.IDENTIFY,
			d: {
				token: this.client.tokenHandler.token ?? "",
				intents: this.client.options.intents,
				properties: { os: "windows", browser: "idk", device: "idk" },
			},
		};

		this.send(identifyData);
	}

	private startHeartbeat(interval: number) {
		this.heartbeatInterval = setInterval(() => {
			const data: GatewayHeartbeat = { op: GatewayOperations.HEARTBEAT, d: this.sequence };
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
