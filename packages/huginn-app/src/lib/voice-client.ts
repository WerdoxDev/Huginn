import { EventEmitterWithHistory } from "@huginn/api/src/event-emitter";
import { client } from "@stores/apiStore";
import { settingsStore } from "@stores/settingsStore";
import { voiceStore } from "@stores/voiceStore";

export class AudioLevelChecker extends EventEmitterWithHistory {
	private audioContext: AudioContext | undefined;
	private volumeNode: AudioWorkletNode | undefined;
	private gainNode: GainNode | undefined;
	private isStopped = false;

	public async startChecking(stream: MediaStream, gain: number) {
		this.stopChecking();
		this.isStopped = false;

		this.audioContext = new AudioContext();
		await this.audioContext.audioWorklet.addModule("src/lib/volume-processor.js");

		if (this.isStopped) {
			this.stopChecking();
			return;
		}

		const source = this.audioContext.createMediaStreamSource(stream);
		this.volumeNode = new AudioWorkletNode(this.audioContext, "volume-processor");

		this.gainNode = this.audioContext.createGain();
		source.connect(this.gainNode);
		this.gainNode.gain.value = gain / 100;
		this.gainNode.connect(this.volumeNode).connect(this.audioContext.destination);

		this.volumeNode.port.onmessage = (event: MessageEvent<{ db: number }>) => {
			this.emit("audio-level", event.data.db);
		};
	}

	public setGain(gain: number) {
		if (this.gainNode) {
			this.gainNode.gain.value = gain / 100;
		}
	}

	public stopChecking() {
		this.isStopped = true;
		this.volumeNode?.disconnect();
		this.audioContext?.close();
		this.volumeNode = undefined;
		this.audioContext = undefined;
	}
}

export const audioLevel = new AudioLevelChecker();
let inputThreshold = 0;

export function listenToVoiceEvents() {
	const unlisten = client.voice.listen("transport_ready", async (d) => {
		if (!client.user?.id) {
			return;
		}

		inputThreshold = settingsStore.getState().inputThreshold;
		const stream = await getInputStream();

		audioLevel.startChecking(stream, settingsStore.getState().inputVolume);
		audioLevel.on("audio-level", onAudioLevel);

		voiceStore.getState().addRemoteSource(client.user.id, "0", "0", "audio", stream);

		const audioTrack = stream.getAudioTracks()[0];
		const videoTrack = stream.getVideoTracks()[0];

		await client.voice.startStreaming(undefined, audioTrack);
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

	settingsStore.subscribe((s) => {
		for (const audio of audioInstances) {
			audio.gainNode.gain.value = s.outputVolume / 100;
		}
		inputThreshold = s.inputThreshold;
		audioLevel.setGain(s.inputVolume);
	});

	return () => {
		unlisten();
		unlisten2();
		unlisten3();
		unlisten4();
	};
}

function onAudioLevel(db: number) {
	if (db > inputThreshold) {
		client.voice.audioProducer?.resume();
	} else {
		client.voice.audioProducer?.pause();
	}
}

export async function getInputStream() {
	return await navigator.mediaDevices.getUserMedia({
		audio: {
			deviceId: settingsStore.getState().inputDeviceId,
			sampleRate: 48000,
			channelCount: 2,
			echoCancellation: false,
			noiseSuppression: false,
			autoGainControl: false,
		},
		video: false,
	});
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
