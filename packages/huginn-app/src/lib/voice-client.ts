import { EventEmitterWithHistory } from "@huginn/api/src/event-emitter";
import { client } from "@stores/apiStore";
import { settingsStore } from "@stores/settingsStore";
import { voiceStore } from "@stores/voiceStore";

export class AudioLevelChecker extends EventEmitterWithHistory {
	private audioContext: AudioContext | undefined;
	private volumeNode: AudioWorkletNode | undefined;
	private isStopped = false;

	public async startChecking(stream: MediaStream) {
		this.stopChecking();
		this.isStopped = false;

		this.audioContext = new AudioContext();
		await this.audioContext.audioWorklet.addModule(new URL("volume-processor.js", import.meta.url));

		if (this.isStopped) {
			this.stopChecking();
			return;
		}

		const source = this.audioContext.createMediaStreamSource(stream);
		this.volumeNode = new AudioWorkletNode(this.audioContext, "volume-processor");

		source.connect(this.volumeNode).connect(this.audioContext.destination);

		this.volumeNode.port.onmessage = (event: MessageEvent<{ db: number }>) => {
			this.emit("audio-level", event.data.db);
		};
	}

	public stopChecking() {
		this.isStopped = true;
		this.volumeNode?.disconnect();
		this.audioContext?.close();
		this.volumeNode = undefined;
		this.audioContext = undefined;
	}
}

export class VoiceInputDevice {
	public currentStream?: MediaStream;
	private gainNode?: GainNode;

	public async getStream(deviceId: string, volumePercentage: number) {
		const stream = await navigator.mediaDevices.getUserMedia({
			audio: {
				deviceId: deviceId,
				sampleRate: 48000,
				channelCount: 2,
				echoCancellation: false,
				noiseSuppression: false,
				autoGainControl: false,
			},
			video: false,
		});

		const audioContext = new AudioContext();
		const source = audioContext.createMediaStreamSource(stream);
		this.gainNode = audioContext.createGain();
		this.gainNode.gain.value = volumePercentage / 100;

		source.connect(this.gainNode);

		const destination = audioContext.createMediaStreamDestination();
		this.gainNode.connect(destination);

		this.currentStream = destination.stream;
		// this.currentStream = stream;
		return this.currentStream;
	}

	public setGain(volumePercentage: number) {
		if (this.gainNode) {
			this.gainNode.gain.value = volumePercentage / 100;
		}
	}
}

let inputDevice: VoiceInputDevice;
let inputThreshold = 0;

export function listenToVoiceEvents() {
	const unlisten = client.voice.listen("transport_ready", async (d) => {
		if (!client.user?.id) {
			return;
		}

		const settings = settingsStore.getState();
		inputThreshold = settings.inputThreshold;
		inputDevice = new VoiceInputDevice();
		const stream = await inputDevice.getStream(settings.inputDeviceId, settings.inputVolume);

		const audioLevel = new AudioLevelChecker();
		audioLevel.startChecking(stream);
		audioLevel.on("audio-level", onAudioLevel);

		if (client.voice.micProducer) {
			voiceStore.getState().addRemoteSource(client.user.id, undefined, client.voice.micProducer.id, "audio", stream, audioLevel);
		}

		await startVoiceStreaming();
	});

	const unlisten2 = client.voice.listen("consumer_created", (d) => {
		const remoteStream = new MediaStream([d.track]);

		if (d.track.kind === "audio") {
			const audioLevel = new AudioLevelChecker();
			audioLevel.startChecking(remoteStream);
			audioLevel.on("audio-level", (db: number) => {
				const speaking = db > -100;
				voiceStore.getState().updateSpeakingState(d.producerUserId, speaking);
			});

			voiceStore.getState().addRemoteSource(d.producerUserId, d.consumerId, d.producerId, "audio", remoteStream, audioLevel);
		} else {
			voiceStore.getState().addRemoteSource(d.producerUserId, d.consumerId, d.producerId, "video", remoteStream);
		}
		playRemoteSources();
	});

	const unlisten3 = client.voice.listen("producer_closed", (d) => {
		const voice = voiceStore.getState();
		const userId = voice.remoteSources.find((x) => x.producerId === d.producerId && x.kind === "audio")?.userId;

		voice.removeRemoteSource(d.producerId);

		if (userId) {
			voice.removeSpeakingState(userId);
		}
	});

	const unlisten4 = client.voice.listen("disconnected", () => {
		voiceStore.getState().clearRemoteSources();
		voiceStore.getState().clearSpeakingStates();
	});

	const unlisten5 = settingsStore.subscribe(async (s, old) => {
		for (const audio of audioInstances) {
			audio.gainNode.gain.value = s.outputVolume / 100;
		}
		inputThreshold = s.inputThreshold;
		inputDevice?.setGain(s.inputVolume);

		if (s.inputDeviceId !== old.inputDeviceId) {
			await startVoiceStreaming();
		}
	});

	// pause audio immidiately after the local producer is created
	const unlisten6 = client.voice.listen("local_producer_created", (d) => {
		if (!client.user) {
			return;
		}

		if (client.voice.localVoiceState.audioPaused) {
			client.voice.pauseMedia("audio");
		}

		if (client.voice.localVoiceState.audioMuted) {
			client.voice.muteAudio();
		}

		const videoProducer = client.voice.screenShareProducers?.video;
		if (videoProducer?.id === d.producerId && videoProducer.track) {
			const stream = new MediaStream([videoProducer.track]);
			const store = voiceStore.getState();
			if (store.remoteSources.find((x) => x.producerId === videoProducer.id)) {
				store.updateRemoteSource(videoProducer.id, stream);
			} else {
				store.addRemoteSource(client.user.id, undefined, d.producerId, "video", stream);
			}
		}
	});

	return () => {
		unlisten();
		unlisten2();
		unlisten3();
		unlisten4();
		unlisten5();
		unlisten6();
	};
}

async function startVoiceStreaming() {
	if (!client.voice.connectionInfo) {
		return;
	}

	const settings = settingsStore.getState();
	const otherStream = await inputDevice.getStream(settings.inputDeviceId, settings.inputVolume);
	const audioTrack = otherStream.getAudioTracks()[0];
	const videoTrack = otherStream.getVideoTracks()[0];

	await client.voice.startStreaming(undefined, audioTrack);
}

const tolerance = 0;
let timeout: number | undefined;
let lastState = true;
function onAudioLevel(db: number) {
	const userId = client.user?.id ?? "";
	if (db > inputThreshold) {
		lastState = true;

		if (timeout) {
			return;
		}

		clearTimeout(timeout);
		timeout = window.setTimeout(() => {
			if (!lastState) {
				client.voice.pauseMedia("audio");
				voiceStore.getState().updateSpeakingState(userId, false);
			}
			timeout = undefined;
		}, 500);

		if (client.voice.micProducer?.paused) {
			if (client.voice.resumeMedia("audio")) {
				voiceStore.getState().updateSpeakingState(userId, true);
			}
		}
	} else if (db <= inputThreshold - tolerance) {
		lastState = false;
	}
}

const audioInstances: Array<{ element: HTMLAudioElement; context: AudioContext; gainNode: GainNode; abortController: AbortController }> = [];
function playRemoteSources() {
	// Remove old ones
	for (const audio of audioInstances) {
		audio.abortController.abort();
		audio.gainNode.disconnect();
		audio.context.close();
		audio.element.pause();
		audio.element.srcObject = null;
	}
	audioInstances.splice(0, audioInstances.length);

	// Re-add all
	for (const remoteSource of voiceStore.getState().remoteSources) {
		if (remoteSource.userId === client.user?.id || remoteSource.kind === "video" || !remoteSource.srcObject) {
			continue;
		}

		const audio = document.createElement("audio");
		audio.autoplay = false;
		audio.srcObject = remoteSource.srcObject;

		const audioContext = new AudioContext({ sinkId: settingsStore.getState().outputDeviceId });
		const gainNode = audioContext.createGain();

		const controller = new AbortController();
		audioInstances.push({ element: audio, context: audioContext, gainNode: gainNode, abortController: controller });

		audio.addEventListener(
			"loadedmetadata",
			(e) => {
				if (!audio.srcObject) return;

				const audioSource = audioContext.createMediaStreamSource(audio.srcObject as MediaStream);
				audioSource.connect(gainNode);
				gainNode.connect(audioContext.destination);

				gainNode.gain.value = 1;
				controller.abort();
			},
			{ signal: controller.signal },
		);
	}
}
