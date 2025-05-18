import {
	constants,
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
	type VoiceProducerClosedData,
	type VoiceProducerCreatedData,
	type VoiceReadyData,
	type VoiceTransportConnectedData,
	type VoiceTransportCreatedData,
} from "@huginn/shared";
import * as mediasoupClient from "mediasoup-client";
import type { Consumer, Producer, Transport } from "mediasoup-client/types";
import { EventEmitterWithHistory } from "./event-emitter";
import type { HuginnClient } from "./huginn-client";
import type { VoiceOptions } from "./types";
import { defaultClientOptions } from "./utils";

export class Voice {
	public socket?: WebSocket;
	private options: VoiceOptions;
	private client: HuginnClient;
	private heartbeatInterval?: ReturnType<typeof setInterval>;
	private lastPingStart?: number;
	private sequence?: number;
	private readonly emitter = new EventEmitterWithHistory();

	public localVoiceState: { audioPaused: boolean; audioMuted: boolean; consumersMuted: boolean; streaming: boolean; camera: boolean };
	public micProducer?: Producer;
	public cameraProducer?: Producer;
	public screenShareProducers?: { video: Producer; audio?: Producer };
	public connectionInfo?: { token: string; channelId: Snowflake; guildId: Snowflake | null };
	public sendTransport?: Transport;
	private device?: mediasoupClient.Device;
	private initialProducers?: ProducerData[];
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
		this.localVoiceState = { consumersMuted: false, audioMuted: false, audioPaused: true, streaming: false, camera: false };
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
		this.reset();
	}

	public async startStreaming(videoTrack?: MediaStreamTrack, audioTrack?: MediaStreamTrack): Promise<void> {
		if (!this.sendTransport) {
			return;
		}

		if (videoTrack) {
			this.cameraProducer = await this.sendTransport.produce({
				track: videoTrack,
			});
			this.emit("local_producer_created", { producerId: this.cameraProducer.id });
		}

		if (audioTrack) {
			if (this.micProducer) {
				this.micProducer.replaceTrack({ track: audioTrack });
			} else {
				this.micProducer = await this.sendTransport.produce({
					track: audioTrack,
				});

				this.emit("local_producer_created", { producerId: this.micProducer.id });
			}
		}
	}

	public async startScreenSharing(videoTrack: MediaStreamTrack, audioTrack?: MediaStreamTrack): Promise<void> {
		if (!this.sendTransport) {
			return;
		}

		let newProducers = false;
		let videoProducer: Producer;
		let audioProducer: Producer | undefined;

		if (this.screenShareProducers?.video) {
			await this.screenShareProducers.video.replaceTrack({ track: videoTrack });
			videoProducer = this.screenShareProducers.video;
		} else {
			videoProducer = await this.sendTransport.produce({
				track: videoTrack,
				encodings: [{ scalabilityMode: "L1T3" }],
				codecOptions: { videoGoogleStartBitrate: 1000 },
			});
			newProducers = true;
		}

		if (audioTrack) {
			if (this.screenShareProducers?.audio) {
				await this.screenShareProducers.audio.replaceTrack({ track: audioTrack });
				audioProducer = this.screenShareProducers.audio;
			} else {
				audioProducer = await this.sendTransport.produce({ track: audioTrack });
				newProducers = true;
			}
		}

		// const audioProducer = audioTrack ? await this.sendTransport.produce({ track: audioTrack }) : undefined;

		this.screenShareProducers = {
			video: videoProducer,
			audio: audioProducer,
		};

		if (newProducers) {
		}
		this.emit("local_producer_created", { producerId: videoProducer.id });

		this.localVoiceState.streaming = true;
		this.emit("local_voice_state_changed", this.localVoiceState);
		// if (audioProducer) {
		// 	this.emit("local_producer_created", { producerId: audioProducer?.id });
		// }
	}

	public stopScreenSharing(): void {
		if (!this.connectionInfo || !this.screenShareProducers) {
			return;
		}

		const closeProducerData: VoicePayload<VoiceOperations.CLOSE_PRODUCER> = {
			op: VoiceOperations.CLOSE_PRODUCER,
			d: { channelId: this.connectionInfo.channelId, producerId: this.screenShareProducers.video.id },
		};

		this.send(closeProducerData);

		this.client.gateway.updateVoiceState(this.localVoiceState.audioMuted, this.localVoiceState.consumersMuted, false, this.localVoiceState.camera);

		this.localVoiceState.streaming = false;
		this.emit("local_voice_state_changed", this.localVoiceState);
	}

	public muteAudio(): void {
		this.localVoiceState.audioMuted = true;
		this.micProducer?.pause();
		this.emit("local_voice_state_changed", this.localVoiceState);
	}

	public unmuteAudio(): void {
		this.localVoiceState.audioMuted = false;
		if (!this.localVoiceState.audioPaused && this.micProducer?.paused) {
			this.micProducer?.resume();
			this.emit("local_voice_state_changed", this.localVoiceState);
		}
	}

	public pauseMedia(type: "audio" | "video"): void {
		if (type === "audio") {
			this.localVoiceState.audioPaused = true;
			if (!this.micProducer?.paused) {
				this.micProducer?.pause();
				this.emit("local_voice_state_changed", this.localVoiceState);
			}
		}
	}

	public resumeMedia(type: "audio" | "video"): boolean {
		if (type === "audio") {
			this.localVoiceState.audioPaused = false;

			if (!this.localVoiceState?.audioMuted && this.micProducer?.paused) {
				this.micProducer.resume();
				this.emit("local_voice_state_changed", this.localVoiceState);
				return true;
			}
		}

		return false;
	}

	public muteConsumers(): void {
		for (const consumer of this.consumers.values()) {
			if (!consumer.paused) {
				consumer.pause();
			}
		}
		this.localVoiceState.consumersMuted = true;
		this.emit("local_voice_state_changed", this.localVoiceState);
	}

	public unmuteConsumers(): void {
		for (const consumer of this.consumers.values()) {
			if (consumer.paused) {
				consumer.resume();
			}
		}
		this.localVoiceState.consumersMuted = false;
		this.emit("local_voice_state_changed", this.localVoiceState);
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

		this.emit("connected", undefined);
	}

	private onClose(e: CloseEvent) {
		if (this.options.log) {
			console.log("[Voice] Closed", e.code, e.reason);
		}

		this.stopHeartbeat();
		this.reset();

		this.emit("disconnected", undefined);
	}

	private reset() {
		this.sequence = undefined;
		this.socket = undefined;
		this.consumers = new Map();
		this.connectionInfo = undefined;
		this.recvTransport = undefined;
		this.sendTransport = undefined;
		this.initialProducers = undefined;
		this.micProducer = undefined;
		this.cameraProducer = undefined;
		this.screenShareProducers = undefined;
		this.device = undefined;
		this.localVoiceState = { audioPaused: true, audioMuted: false, consumersMuted: false, streaming: false, camera: false };
	}

	private async onMessage(e: MessageEvent) {
		const data: VoicePayload = JSON.parse(e.data);

		switch (data.op) {
			case VoiceOperations.HELLO: {
				await this.handleHello(data.d as VoiceHelloData);
				break;
			}
			case VoiceOperations.READY: {
				await this.handleReady(data.d as VoiceReadyData);
				break;
			}
			case VoiceOperations.TRANSPORT_CREATED: {
				await this.handleTransportCreated(data.d as VoiceTransportCreatedData);
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
				await this.handleNewProducer(data.d as VoiceNewProducerData);
				break;
			}
			case VoiceOperations.CONSUMER_CREATED: {
				await this.handleConsumerCreated(data.d as VoiceConsumerCreatedData);
				break;
			}
			case VoiceOperations.CONSUMER_RESUMED: {
				const resumed = data.d as VoiceConsumerResumedData;
				console.log(`[Voice] Resumed consumer ${resumed.consumerId}`);
				break;
			}
			case VoiceOperations.PEER_LEFT: {
				this.handlePeerLeft(data.d as VoicePeerLeftData);
				break;
			}
			case VoiceOperations.PONG: {
				this.handlePong();
				break;
			}
			case VoiceOperations.PRODUCER_CLOSED: {
				this.handleProducerClosed(data.d as VoiceProducerClosedData);
				break;
			}
		}
	}

	private async waitForProducerCreated() {
		return await new Promise<VoiceProducerCreatedData>((res) => {
			const onMessage = (e: MessageEvent) => {
				const data: VoicePayload = JSON.parse(e.data);

				if (data.op === VoiceOperations.PRODUCER_CREATED) {
					this.socket?.removeEventListener("message", onMessage);
					res(data.d as VoiceProducerCreatedData);
				}
			};

			this.socket?.addEventListener("message", onMessage.bind(this));
		});
	}

	private handlePeerLeft(data: VoicePeerLeftData) {
		for (const producerId of data.producerIds) {
			const consumer = Array.from(this.consumers.values()).find((c) => c.producerId === producerId);
			if (consumer) {
				consumer.close();
				this.consumers.delete(consumer.id);
				this.emit("producer_closed", { producerId, userId: data.userId });
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

		this.emit("consumer_created", {
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

					const { producerId } = await this.waitForProducerCreated();
					callback({ id: producerId });
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

	private handleProducerClosed(data: VoiceProducerClosedData) {
		const consumer = Array.from(this.consumers.values()).find((c) => c.producerId === data.producerId);
		if (consumer) {
			consumer.close();
			this.consumers.delete(consumer.id);
		}

		if (this.screenShareProducers?.video.id === data.producerId) {
			this.screenShareProducers.video.close();
		}

		if (this.screenShareProducers?.audio?.id === data.producerId) {
			this.screenShareProducers.audio.close();
		}

		if ((!this.screenShareProducers?.audio || this.screenShareProducers?.audio?.closed) && this.screenShareProducers?.video.closed) {
			this.screenShareProducers = undefined;
			console.log("CLOSED SCREEN SHARE");
		}

		this.emit("producer_closed", { producerId: data.producerId, userId: data.userId });
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
		this.sendPing();

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

	private handlePong() {
		const rtt = Date.now() - (this.lastPingStart ?? 0);
		this.emit("ping", { rtt });

		setTimeout(() => {
			this.sendPing();
		}, constants.VOICE_CLIENT_PING_INTERVAL);
	}

	private sendPing() {
		const pingData: VoicePayload<VoiceOperations.PING> = { op: VoiceOperations.PING, d: undefined };
		this.lastPingStart = Date.now();
		this.send(pingData);
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
