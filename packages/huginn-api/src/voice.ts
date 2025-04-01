import {
	GatewayCode,
	type ProducerData,
	type Snowflake,
	type VoiceConsumerCreatedData,
	type VoiceConsumerResumedData,
	type VoiceEvents,
	type VoiceHelloData,
	type VoiceNewProducerData,
	VoiceOperations,
	type VoicePayload,
	type VoicePeerLeftData,
	type VoiceProducerCreatedData,
	type VoiceReadyData,
	type VoiceTransportConnectedData,
	type VoiceTransportCreatedData,
} from "@huginn/shared";
import * as mediasoupClient from "mediasoup-client";
import type { Consumer, Transport } from "mediasoup-client/types";
import { EventEmitterWithHistory } from "./event-emitter";
import type { HuginnClient } from "./huginn-client";
import type { VoiceOptions } from "./types";
import { defaultClientOptions } from "./utils";

export class Voice {
	public socket?: WebSocket;
	private options: VoiceOptions;
	private client: HuginnClient;
	private heartbeatInterval?: ReturnType<typeof setInterval>;
	private sequence?: number;
	private readonly emitter = new EventEmitterWithHistory();

	public connectionInfo?: { token: string; channelId: Snowflake; guildId: Snowflake | null };
	private device?: mediasoupClient.Device;
	private initialProducers?: ProducerData[];
	private sendTransport?: Transport;
	private recvTransport?: Transport;
	private consumers: Map<string, Consumer>;

	public on<EventName extends keyof VoiceEvents>(
		eventName: EventName,
		handler: (eventArg: VoiceEvents[EventName]) => void,
		withoutHistory?: boolean,
	): void {
		this.emitter.on(eventName, handler, withoutHistory);
	}

	public off<EventName extends keyof VoiceEvents>(eventName: EventName, handler: (eventArg: VoiceEvents[EventName]) => void): void {
		this.emitter.off(eventName, handler);
	}

	public listen<EventName extends keyof VoiceEvents>(
		eventName: EventName,
		handler: (eventArg: VoiceEvents[EventName]) => void,
		withoutHistory?: boolean,
	): () => void {
		this.on(eventName, handler, withoutHistory);
		return () => this.off(eventName, handler);
	}

	private emit<EventName extends keyof VoiceEvents>(eventName: EventName, eventArg: VoiceEvents[EventName]): void {
		this.emitter.emit(eventName, eventArg);
	}

	public constructor(client: HuginnClient, options?: Partial<VoiceOptions>) {
		this.options = { ...defaultClientOptions.voice, ...options };
		this.client = client;
		this.consumers = new Map();
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
		this.consumers = new Map();
		this.connectionInfo = undefined;
		this.recvTransport = undefined;
		this.sendTransport = undefined;
		this.initialProducers = undefined;
		this.device = undefined;
	}

	public async startStreaming(videoTrack?: MediaStreamTrack, audioTrack?: MediaStreamTrack): Promise<void> {
		if (videoTrack) {
			const videoProducer = await this.sendTransport?.produce({ track: videoTrack });
		}

		if (audioTrack) {
			const audioProducer = await this.sendTransport?.produce({ track: audioTrack });
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
			case VoiceOperations.TRANSPORT_CREATED: {
				const created = data.d as VoiceTransportCreatedData;
				await this.handleTransportCreated(created);
				break;
			}
			case VoiceOperations.TRANSPORT_CONNECTED: {
				const connected = data.d as VoiceTransportConnectedData;
				console.log(`[Voice] Transport connected ${connected.transportId}}`);
				break;
			}
			case VoiceOperations.PRODUCER_CREATED: {
				const created = data.d as VoiceProducerCreatedData;
				console.log(`[Voice] Producer created ${created.producerId}`);
				break;
			}
			case VoiceOperations.NEW_PRODUCER: {
				const newProducer = data.d as VoiceNewProducerData;
				await this.handleNewProducer(newProducer);
				break;
			}
			case VoiceOperations.CONSUMER_CREATED: {
				const created = data.d as VoiceConsumerCreatedData;
				await this.handleConsumerCreated(created);
				break;
			}
			case VoiceOperations.CONSUMER_RESUMED: {
				const resumed = data.d as VoiceConsumerResumedData;
				console.log(`[Voice] Resumed consumer ${resumed.consumerId}`);
				break;
			}
			case VoiceOperations.PEER_LEFT: {
				const left = data.d as VoicePeerLeftData;
				this.handlePeerLeft(left);
				break;
			}
		}
	}

	private handlePeerLeft(data: VoicePeerLeftData) {
		for (const producerId of data.producerIds) {
			const consumer = Array.from(this.consumers.values()).find((c) => c.producerId === producerId);
			if (consumer) {
				consumer.close();
				this.consumers.delete(consumer.id);
				this.emit("producer_removed", { producerId });
			}
		}
	}

	private async handleConsumerCreated(data: VoiceConsumerCreatedData) {
		if (!this.recvTransport || !this.connectionInfo) {
			return;
		}

		const consumer = await this.recvTransport.consume({
			id: data.consumerId,
			producerId: data.producerId,
			rtpParameters: data.rtpParameters,
			kind: data.kind,
		});

		this.consumers.set(consumer.id, consumer);

		this.emit("producer_created", {
			track: consumer.track,
			consumerId: data.consumerId,
			producerId: data.producerId,
			producerUserId: data.producerUserId,
		});

		const resumeConsumerData: VoicePayload<VoiceOperations.RESUME_CONSUMER> = {
			op: VoiceOperations.RESUME_CONSUMER,
			d: { channelId: this.connectionInfo.channelId, consumerId: data.consumerId },
		};

		this.send(resumeConsumerData);
	}

	private async handleNewProducer(data: VoiceNewProducerData) {
		if (!this.connectionInfo || !this.device || !this.recvTransport) {
			return;
		}

		const consumeData: VoicePayload<VoiceOperations.CONSUME> = {
			op: VoiceOperations.CONSUME,
			d: {
				channelId: this.connectionInfo.channelId,
				producerId: data.producerId,
				rtpCapabilities: this.device?.rtpCapabilities,
				transportId: this.recvTransport.id,
			},
		};

		this.send(consumeData);
	}

	private async handleTransportCreated(data: VoiceTransportCreatedData) {
		if (!this.connectionInfo) {
			return;
		}

		try {
			if (data.direction === "send") {
				this.sendTransport = this.device?.createSendTransport(data.params);

				this.sendTransport?.on("connect", async ({ dtlsParameters }, callback, errback) => {
					const connectTransportData: VoicePayload<VoiceOperations.CONNECT_TRANSPORT> = {
						op: VoiceOperations.CONNECT_TRANSPORT,
						// biome-ignore lint/style/noNonNullAssertion: connectionInfo and sendTransport cannot be null here
						d: { channelId: this.connectionInfo!.channelId, transportId: this.sendTransport!.id, dtlsParameters },
					};

					this.send(connectTransportData);
					callback();
				});

				this.sendTransport?.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
					const produceData: VoicePayload<VoiceOperations.PRODUCE> = {
						op: VoiceOperations.PRODUCE,
						// biome-ignore lint/style/noNonNullAssertion: connectionInfo and sendTransport cannot be null here
						d: { channelId: this.connectionInfo!.channelId, transportId: this.sendTransport!.id, kind, rtpParameters },
					};

					this.send(produceData);
					callback({ id: "temp-id" });
				});

				this.emit("transport_ready", { channelId: this.connectionInfo.channelId });
			} else if (data.direction === "recv") {
				this.recvTransport = this.device?.createRecvTransport(data.params);

				this.recvTransport?.on("connect", async ({ dtlsParameters }, callback, errback) => {
					const connectTransportData: VoicePayload<VoiceOperations.CONNECT_TRANSPORT> = {
						op: VoiceOperations.CONNECT_TRANSPORT,
						// biome-ignore lint/style/noNonNullAssertion: connectionInfo and recvTransport cannot be null here
						d: { channelId: this.connectionInfo!.channelId, transportId: this.recvTransport!.id, dtlsParameters },
					};

					this.send(connectTransportData);
					callback();
				});

				if (this.initialProducers) {
					for (const producer of this.initialProducers) {
						await this.handleNewProducer(producer);
					}
				}
			}
		} catch (e) {
			console.error("Failed to setup transport:", e);
		}
	}

	private async handleReady(data: VoiceReadyData) {
		if (!this.connectionInfo) {
			return;
		}

		this.device = new mediasoupClient.Device();
		await this.device.load({ routerRtpCapabilities: data.rtpCapabilities });

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

		this.initialProducers = data.producers;
	}

	private async handleHello(data: VoiceHelloData) {
		this.startHeartbeat(data.heartbeatInterval);

		if (!this.client.user || !this.connectionInfo) {
			throw new Error("Client user or connection info was null when identifying voice websocket");
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
