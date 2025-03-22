import {
	GatewayCode,
	type GatewayEvents,
	type GatewayHeartbeat,
	type GatewayHello,
	type GatewayIdentify,
	GatewayOperations,
	type GatewayReadyData,
	type GatewayResume,
} from "@huginn/shared";
import type {
	GatewayDispatch,
	GatewayPayload,
	GatewayResumedData,
	GatewayUpdateVoiceState,
	GatewayVoiceServerUpdateData,
	Snowflake,
} from "@huginn/shared";
import { isOpcode } from "@huginn/shared";
import type { HuginnClient } from ".";
import { EventEmitterWithHistory } from "./event-emitter";
import { ClientReadyState, type GatewayOptions } from "./types";
import { defaultClientOptions } from "./utils";

export class Gateway {
	public readonly options: GatewayOptions;
	private readonly client: HuginnClient;
	private readonly emitter = new EventEmitterWithHistory();

	public socket?: WebSocket;
	public readyData?: GatewayReadyData;
	public sessionId?: Snowflake;

	private heartbeatInterval?: ReturnType<typeof setInterval>;
	private sequence?: number;

	private emit<EventName extends keyof GatewayEvents>(eventName: EventName, eventArg: GatewayEvents[EventName]): void {
		this.emitter.emit(eventName, eventArg);
	}

	on<EventName extends keyof GatewayEvents>(
		eventName: EventName,
		handler: (eventArg: GatewayEvents[EventName]) => void,
		withoutHistory?: boolean,
	): void {
		this.emitter.on(eventName, handler, withoutHistory);
	}

	off<EventName extends keyof GatewayEvents>(eventName: EventName, handler: (eventArg: GatewayEvents[EventName]) => void): void {
		this.emitter.off(eventName, handler);
	}

	public constructor(client: HuginnClient, options?: Partial<GatewayOptions>) {
		this.options = { ...defaultClientOptions.gateway, ...options };
		this.client = client;
	}

	public connect(): void {
		this.socket = this.options.createSocket(this.options.url);
		this.startListening();
	}

	public async authenticate(): Promise<boolean> {
		if (this.socket?.readyState !== WebSocket.OPEN && this.socket?.readyState !== WebSocket.CONNECTING) {
			return false;
		}

		const result = await new Promise((r) => {
			if (this.client.user && this.client.readyState === ClientReadyState.READY) {
				r(true);
			} else {
				const onMessage = (data: GatewayPayload) => {
					if (isOpcode(data, GatewayOperations.HELLO)) {
						this.sendIdentify();
					}

					if (isOpcode(data, GatewayOperations.DISPATCH)) {
						if (data.t === "ready") {
							r(true);

							this.off("message", onMessage);
						}
					}
				};

				const onClose = () => {
					r(false);
					this.off("message", onMessage);
					this.socket?.removeEventListener("close", onClose);
				};

				this.on("message", onMessage);
				this.socket?.addEventListener("close", onClose);
			}
		});

		if (!result) {
			return false;
		}

		return true;
	}

	/**
	 * Connects to a voice channel.
	 * @param guildId can be set to null if you are connecting to a direct channel call.
	 */
	public async connectToVoice(guildId: Snowflake | null, channelId: Snowflake): Promise<void> {
		const updateVoiceStateData: GatewayUpdateVoiceState = {
			op: GatewayOperations.VOICE_STATE_UPDATE,
			d: {
				guildId: guildId,
				channelId: channelId,
				selfDeaf: false,
				selfMute: false,
			},
		};

		this.send(updateVoiceStateData);

		const token = await new Promise<string>((resolve, reject) => {
			const onMessage = (data: GatewayPayload) => {
				if (isOpcode(data, GatewayOperations.DISPATCH)) {
					if (data.t === "voice_server_update") {
						const dispatch = data.d as GatewayVoiceServerUpdateData;
						resolve(dispatch.token);

						this.off("message", onMessage);
					}
				}
			};

			this.on("message", onMessage);
		});

		this.client.voice.connect(token, channelId, guildId);
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
			console.log("[Gateway] Connected");
		}

		this.emit("open", undefined);
	}

	private onClose(e: CloseEvent) {
		if (this.options.log) {
			console.log("[Gateway] Closed", e.code, e.reason);
		}

		this.stopHeartbeat();
		this.emit("close", e.code);

		this.readyData = undefined;

		if (e.code === GatewayCode.INTENTIONAL_CLOSE) {
			return;
		}

		this.tryReconnect(e);
	}

	private async tryReconnect(event: CloseEvent) {
		setTimeout(async () => {
			this.client.readyState = ClientReadyState.RECONNECRING;

			if (event.code === GatewayCode.INVALID_SESSION) {
				this.sequence = undefined;
				this.sessionId = undefined;
			}

			this.connect();

			if (this.client.user) {
				await this.authenticate();
			}
		}, 2000);
	}

	private async onMessage(e: MessageEvent) {
		if (typeof e.data !== "string") {
			console.error("Non string messages are not yet supported");
			return;
		}

		const data: GatewayPayload = JSON.parse(e.data);

		switch (data.op) {
			case GatewayOperations.HELLO: {
				const hello = data as GatewayHello;
				await this.handleHello(hello);
				this.emit("hello", hello.d);
				break;
			}
			case GatewayOperations.DISPATCH: {
				this.sequence = data.s;
				const dispatch = data as GatewayDispatch;

				if (dispatch.t === "resumed") {
					this.sessionId = (dispatch.d as GatewayResumedData).sessionId;
				}

				if (dispatch.t === "ready") {
					this.handleReady(dispatch.d as GatewayReadyData);
				}

				this.emit(dispatch.t, dispatch.d);
			}
		}

		this.emit("message", data);
	}

	public close(): void {
		this.socket?.close(GatewayCode.INTENTIONAL_CLOSE);
		this.sequence = undefined;
		this.sessionId = undefined;
	}

	private async handleHello(data: GatewayHello) {
		this.sessionId = data.d.sessionId;
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

	private handleReady(data: GatewayReadyData) {
		this.client.user = data.user;

		this.readyData = data;

		this.client.readyState = ClientReadyState.READY;
	}

	private sendIdentify() {
		const identifyData: GatewayIdentify = {
			op: GatewayOperations.IDENTIFY,
			d: {
				token: this.client.tokenHandler.token ?? "",
				intents: this.options.intents,
				properties: { os: "windows", browser: "idk", device: "idk" },
			},
		};

		this.send(identifyData);
	}

	private startHeartbeat(interval: number) {
		this.heartbeatInterval = setInterval(() => {
			const data: GatewayHeartbeat = { op: GatewayOperations.HEARTBEAT, d: this.sequence };
			if (this.options.log) {
				console.log("[Gateway] Sending Heartbeat");
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
