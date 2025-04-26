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
		// this.gainNode = this.audioContext.createGain();
		// source.connect(this.gainNode);
		// this.gainNode.gain.value = volumePercentage / 100;
		// this.gainNode.connect(this.volumeNode).connect(this.audioContext.destination);

		this.volumeNode.port.onmessage = (event: MessageEvent<{ db: number }>) => {
			this.emit("audio-level", event.data.db);
		};
	}

	// public setGain(volumePercentage: number) {
	// 	if (this.gainNode) {
	// 		this.gainNode.gain.value = volumePercentage / 100;
	// 	}
	// }

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
		// if (this.currentStream) {
		// 	return this.currentStream;
		// }

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

const audioLevel = new AudioLevelChecker();
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

		audioLevel.startChecking(stream);
		audioLevel.on("audio-level", onAudioLevel);

		voiceStore.getState().addRemoteSource(client.user.id, "0", "0", "audio", stream);

		await startVoiceStreaming();
	});

	const unlisten2 = client.voice.listen("producer_created", (d) => {
		const remoteStream = new MediaStream([d.track]);
		voiceStore.getState().addRemoteSource(d.producerUserId, d.consumerId, d.producerId, d.track.kind === "video" ? "video" : "audio", remoteStream);

		playRemoteSources();
	});

	const unlisten3 = client.voice.listen("producer_removed", (d) => {
		voiceStore.getState().removeRemoteSource(d.producerId);
	});

	const unlisten4 = client.voice.listen("disconnected", () => {
		audioLevel.stopChecking();
		voiceStore.getState().clearRemoteSources();
	});

	settingsStore.subscribe(async (s, old) => {
		for (const audio of audioInstances) {
			audio.gainNode.gain.value = s.outputVolume / 100;
		}
		inputThreshold = s.inputThreshold;
		inputDevice?.setGain(s.inputVolume);

		if (s.inputDeviceId !== old.inputDeviceId) {
			await startVoiceStreaming();
		}
	});

	return () => {
		unlisten();
		unlisten2();
		unlisten3();
		unlisten4();
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
let lastState = false;
function onAudioLevel(db: number) {
	if (db > inputThreshold) {
		lastState = true;

		if (timeout) {
			return;
		}

		clearTimeout(timeout);
		timeout = window.setTimeout(() => {
			if (!lastState) {
				console.log("PAUSE");
				client.voice.audioProducer?.pause();
			}
			timeout = undefined;
		}, 500);

		if (client.voice.audioProducer?.paused) {
			console.log("RESUME");
			client.voice.audioProducer?.resume();
		}
	} else if (db <= inputThreshold - tolerance && !client.voice.audioProducer?.paused) {
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
		if (remoteSource.userId === client.user?.id) {
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
