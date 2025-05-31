import { EventEmitterWithHistory } from "@huginn/api/src/event-emitter";
import type { HMediaKind, Snowflake } from "@huginn/shared";
import { client } from "@stores/apiStore";
import { settingsStore } from "@stores/settingsStore";
import { voiceStore } from "@stores/voiceStore";
import { listenEvent } from "./event-handler";

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

export class AudioSourcePlayer {
	private gainNode: GainNode;
	private audioContext: AudioContext;
	private audioElement: HTMLAudioElement;
	private abortController: AbortController;
	public producerId: string;
	public userId: Snowflake;
	public kind: HMediaKind;

	private globalGain: number;
	private localGain?: number;

	public constructor(srcObject: MediaProvider, producerId: string, userId: Snowflake, kind: HMediaKind, globalGain: number) {
		this.globalGain = globalGain;
		this.producerId = producerId;
		this.userId = userId;
		this.kind = kind;
		this.abortController = new AbortController();

		this.audioElement = document.createElement("audio");
		this.audioElement.autoplay = false;
		this.audioElement.srcObject = srcObject;

		this.audioContext = new AudioContext({ sinkId: settingsStore.getState().outputDeviceId });
		this.gainNode = this.audioContext.createGain();

		this.audioElement.addEventListener(
			"loadedmetadata",
			(_e) => {
				if (!this.audioElement.srcObject) return;

				const audioSource = this.audioContext.createMediaStreamSource(this.audioElement.srcObject as MediaStream);
				audioSource.connect(this.gainNode);
				this.gainNode.connect(this.audioContext.destination);

				this.abortController.abort();
			},
			{ signal: this.abortController.signal },
		);
	}

	public stop() {
		this.abortController.abort();
		this.gainNode.disconnect();
		this.audioContext.close();
		this.audioElement.pause();
		this.audioElement.srcObject = null;
	}

	public setGain(globalGain: number | undefined, localGain: number | undefined) {
		if (globalGain) {
			this.globalGain = globalGain;
		}
		if (localGain !== undefined) {
			this.localGain = localGain;
		}

		if (this.localGain === undefined) {
			this.localGain = 100;
		}

		this.gainNode.gain.value = (this.globalGain / 100) * (this.localGain / 100);
	}

	public setSinkId(deviceId: string) {
		this.audioContext.setSinkId(deviceId);
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
		audioLevel.on("audio-level", onLocalAudioLevel);

		const producer = client.voice.producers.get("microphone");
		if (producer) {
			voiceStore.getState().addRemoteSource(client.user.id, undefined, producer.id, producer.appData.mediaKind, stream, audioLevel);
		}

		await startVoiceStreaming();
	});

	const unlisten2 = client.voice.listen("consumer_created", (d) => {
		const remoteStream = new MediaStream([d.track]);

		const store = voiceStore.getState();

		if (d.track.kind === "audio") {
			let audioLevel: AudioLevelChecker | undefined = undefined;
			if (d.kind === "microphone") {
				audioLevel = new AudioLevelChecker();
				audioLevel.startChecking(remoteStream);
				audioLevel.on("audio-level", (db: number) => {
					// not -100 because it sometimes start at ~ -98
					const speaking = db > -95;
					store.updateSpeakingState(d.producerUserId, speaking);
				});
			}

			store.addRemoteSource(d.producerUserId, d.consumerId, d.producerId, d.kind, remoteStream, audioLevel);
		} else {
			store.addRemoteSource(d.producerUserId, d.consumerId, d.producerId, d.kind, remoteStream);
		}

		refreshRemoteSourcePlayers();
	});

	const unlisten3 = client.voice.listen("producer_closed", (d) => {
		const voice = voiceStore.getState();

		voice.removeRemoteSource(d.producerId);

		const userId = voice.remoteSources.find((x) => x.producerId === d.producerId && x.kind === "microphone")?.userId;
		if (userId) {
			voice.removeSpeakingState(userId);
		}

		const audioPlayerIndex = audioSourcePlayers.findIndex((x) => x.producerId === d.producerId);
		if (audioPlayerIndex !== -1) {
			audioSourcePlayers[audioPlayerIndex].stop();
			audioSourcePlayers.splice(audioPlayerIndex, 1);
		}
	});

	const unlisten4 = client.voice.listen("disconnected", () => {
		voiceStore.getState().clearRemoteSources();
		voiceStore.getState().clearSpeakingStates();
	});

	const unlisten5 = settingsStore.subscribe(async (s, old) => {
		if (s.outputVolume !== old.outputVolume) {
			for (const player of audioSourcePlayers) {
				player.setGain(s.outputVolume, undefined);
			}
		}

		if (s.inputThreshold !== old.inputThreshold) {
			inputThreshold = s.inputThreshold;
		}

		if (s.inputVolume !== old.inputVolume) {
			inputDevice?.setGain(s.inputVolume);
		}

		// Start streaming with new input id
		if (s.inputDeviceId !== old.inputDeviceId) {
			await startVoiceStreaming();
		}

		// Play all remote sources through the new output id
		if (s.outputDeviceId !== old.outputDeviceId) {
			for (const player of audioSourcePlayers) {
				player.setSinkId(s.outputDeviceId);
			}
		}
	});

	// pause audio immidiately after the local producer is created
	const unlisten6 = client.voice.listen("local_producer_created", (d) => {
		if (!client.user) {
			return;
		}

		if (d.kind === "microphone") {
			if (client.voice.localVoiceState.audioPaused) {
				client.voice.pauseMicrophone();
			}

			if (client.voice.localVoiceState.audioMuted) {
				client.voice.muteMicrophone();
			}
		}

		if (d.kind === "screen_video") {
			const store = voiceStore.getState();
			const stream = new MediaStream([d.track]);
			if (store.remoteSources.find((x) => x.producerId === d.producerId)) {
				store.updateRemoteSource(d.producerId, stream);
			} else {
				store.addRemoteSource(client.user.id, undefined, d.producerId, d.kind, stream);
			}
		}
	});

	const unlisten7 = listenEvent("voice_preference_changed", (d) => {
		const store = voiceStore.getState();
		const preference = store.voicePreferences.find((x) => x.userId === d.userId);
		const microphonePlayer = audioSourcePlayers.find((x) => x.userId === d.userId && x.kind === "microphone");
		const screensharePlayer = audioSourcePlayers.find((x) => x.userId === d.userId && x.kind === "screen_audio");

		if (!preference || (!microphonePlayer && !screensharePlayer)) {
			return;
		}

		if (microphonePlayer) {
			microphonePlayer.setGain(undefined, preference.microphoneVolume);
		}
		if (screensharePlayer) {
			screensharePlayer.setGain(undefined, preference.screenshareVolume);
		}
	});

	return () => {
		unlisten();
		unlisten2();
		unlisten3();
		unlisten4();
		unlisten5();
		unlisten6();
		unlisten7();
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
function onLocalAudioLevel(db: number) {
	const userId = client.user?.id ?? "";
	if (db > inputThreshold) {
		lastState = true;

		if (timeout) {
			return;
		}

		clearTimeout(timeout);
		timeout = window.setTimeout(() => {
			if (!lastState) {
				client.voice.pauseMicrophone();
				voiceStore.getState().updateSpeakingState(userId, false);
			}
			timeout = undefined;
		}, 500);

		if (client.voice.localVoiceState.audioPaused) {
			if (client.voice.resumeMedia()) {
				voiceStore.getState().updateSpeakingState(userId, true);
			}
		}
	} else if (db <= inputThreshold - tolerance) {
		lastState = false;
	}
}

const audioSourcePlayers: AudioSourcePlayer[] = [];
function refreshRemoteSourcePlayers() {
	const settings = settingsStore.getState();
	const voice = voiceStore.getState();
	// Remove old ones
	for (const player of audioSourcePlayers) {
		player.stop();
	}
	audioSourcePlayers.splice(0, audioSourcePlayers.length);

	// Re-add all
	for (const remoteSource of voice.remoteSources) {
		// "Video" sources are not audio
		if (
			remoteSource.userId === client.user?.id ||
			remoteSource.kind === "camera" ||
			remoteSource.kind === "screen_video" ||
			!remoteSource.srcObject
		) {
			continue;
		}

		const sourcePlayer = new AudioSourcePlayer(
			remoteSource.srcObject,
			remoteSource.producerId,
			remoteSource.userId,
			remoteSource.kind,
			settings.outputVolume,
		);
		audioSourcePlayers.push(sourcePlayer);

		const preference = voice.voicePreferences.find((x) => x.userId === remoteSource.userId);

		if (remoteSource.kind === "microphone") {
			sourcePlayer.setGain(undefined, preference?.microphoneVolume);
		} else if (remoteSource.kind === "screen_audio") {
			sourcePlayer.setGain(undefined, preference?.screenshareVolume);
		}
	}
}
