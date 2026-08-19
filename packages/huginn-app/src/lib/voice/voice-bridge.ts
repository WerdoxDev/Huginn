import type { PluginListenerHandle } from "@capacitor/core";
import type { Consumer, Producer, Transport } from "mediasoup-client/types";

import { ForegroundService, ServiceType } from "@capawesome-team/capacitor-android-foreground-service";
import { HuginnClient, Voice, type VoiceOptions } from "@huginnjs/api";
import { diff, type MediasoupAppData, type ProducerData, type Snowflake, type VoicePreference } from "@huginnjs/shared";
import { NativeMediaDevices } from "@lib/capacitor/media-devices-plugin";
import { getChannelComputedName, getChannels, getGroupChannelName } from "@lib/query-utils";
import { clientStore } from "@stores/clientStoreState";
import { storageStore } from "@stores/storageStore";
import { voiceStore } from "@stores/voiceStore";
import { windowStore } from "@stores/windowStore";

import type { AppSettings, Environment } from "@/types";

import { getHostId } from "../child-window";
import { AudioLevelChecker } from "./audio-level-checker";
import { AudioSourcePlayer } from "./audio-source-player";
import { VoiceClient } from "./voice-client";
import { VoiceDebugger } from "./voice-debugger";
import { VoiceHost } from "./voice-host";
import { VoiceInputDevice } from "./voice-input-device";
import { VoicePopout } from "./voice-popout";

export class VoiceBridge extends Voice {
   public readonly audioSourcePlayers: AudioSourcePlayer[] = [];
   // Map<producerId, ALC>
   public readonly audioLevelCheckers = new Map<Snowflake, AudioLevelChecker>();
   public readonly inputDevice = VoiceInputDevice;
   private loopbackDataUnlisten?: () => void;
   public readonly debugger: VoiceDebugger;
   public readonly popout?: VoicePopout;
   public readonly host?: VoiceHost;

   private microphoneReady?: Promise<void>;

   private releaseInput?: () => void;
   private forgroundServiceListener?: PluginListenerHandle;

   /** Returns the slowest active WebRTC transport RTT, in milliseconds. */
   public async getCurrentRoundTripTime(): Promise<number | undefined> {
      const transports = [this.transport.sendTransport, this.transport.recvTransport].filter(
         (transport): transport is Transport => !!transport && !transport.closed,
      );
      const reports = await Promise.allSettled(transports.map((transport) => transport.getStats()));
      const roundTripTimes = reports
         .filter((result): result is PromiseFulfilledResult<RTCStatsReport> => result.status === "fulfilled")
         .map((result) => this.getRoundTripTimeFromStats(result.value))
         .filter((roundTripTime): roundTripTime is number => roundTripTime !== undefined);

      if (roundTripTimes.length === 0) return undefined;
      return Math.max(...roundTripTimes) * 1000;
   }

   private getRoundTripTimeFromStats(report: RTCStatsReport): number | undefined {
      let selectedCandidatePairId: string | undefined;
      const candidatePairs: RTCIceCandidatePairStats[] = [];

      for (const stat of report.values()) {
         if (stat.type === "transport") {
            selectedCandidatePairId = (stat as RTCTransportStats).selectedCandidatePairId;
         } else if (stat.type === "candidate-pair") {
            candidatePairs.push(stat as RTCIceCandidatePairStats);
         }
      }

      const selectedPair = selectedCandidatePairId ? candidatePairs.find((pair) => pair.id === selectedCandidatePairId) : undefined;
      const activePair = selectedPair ?? candidatePairs.find((pair) => pair.state === "succeeded" && pair.nominated);
      const fallbackPair = activePair ?? candidatePairs.find((pair) => pair.state === "succeeded");
      const roundTripTime = fallbackPair?.currentRoundTripTime;

      return typeof roundTripTime === "number" && Number.isFinite(roundTripTime) ? roundTripTime : undefined;
   }

   public constructor(client: HuginnClient, options?: Partial<VoiceOptions>) {
      super(client, options);

      this.debugger = new VoiceDebugger(client as HuginnClient<VoiceBridge>);

      if (window.opener) return;

      const hostId = getHostId();
      this.popout = new VoicePopout(hostId);
      this.host = new VoiceHost(hostId, this, client as HuginnClient<VoiceBridge>);

      this.on("ready", async () => await this.handleReady());
      this.on("reset", async () => await this.handleReset());

      this.transport.on("consumer_created", async (d) => await this.handleConsumerCreated(d));

      this.transport.on("producer_created", (d) => this.handleProducerCreated(d));
      this.transport.on("remote_producer_created", async (d) => await this.handleRemoteProducerCreated(d));

      this.transport.on("producer_closed", async (d) => await this.handleAnyProducerClosed(d));
      this.transport.on("remote_producer_closed", async (d) => await this.handleAnyProducerClosed(d));

      storageStore.subscribe(
         (state) => state.cache.settings,
         (current, old) => this.handleStorageUpdated(current, old),
      );

      clientStore.subscribe(
         (state) => state.userSettings?.voicePreferences,
         (current) => this.handleVoicePreferenceUpdated(current),
      );
   }

   private async handleReady() {
      const settings = storageStore.getState().getCachedValue("settings");

      const environment = windowStore.getState().environment;
      if (environment === "android") {
         const channelId = this.client.voiceManager.voiceState.gatewayVoiceState.channelId;
         const channel = getChannels()?.find((x) => x.id === channelId);
         const channelName = channel ? getChannelComputedName(channel, channel?.recipientIds) : "Unkown Channel";

         await ForegroundService.startForegroundService({
            id: 1,
            title: "Connected to call",
            body: channelName,
            smallIcon: "ic_notification",
            buttons: [
               { title: "Mute", id: 1 },
               { title: "Deafen", id: 2 },
               { title: "Leave", id: 3 },
            ],
            silent: false,
            serviceType: ServiceType.Microphone,
            notificationChannelId: "background",
         });

         await this.registerForegroundServiceListeners();

         const routes = await NativeMediaDevices.startCommunication();
         if (routes.selectedRouteId && routes.activeRouteId !== routes.selectedRouteId) {
            await NativeMediaDevices.setAudioRoute({ routeId: routes.selectedRouteId });
         }
      }

      this.releaseInput ??= VoiceInputDevice.acquire();
      // Initialize the actual audio sending stream
      await this.openOrReplaceMicrophone(settings.inputDeviceId, settings.inputVolume, settings.noiseSuppression, environment);
   }

   private async handleReset() {
      const environment = windowStore.getState().environment;

      this.releaseInput?.();
      this.releaseInput = undefined;

      this.stopAudioLoopback();

      const voice = voiceStore.getState();
      voice.clearSpeakingStates();

      for (const audioLevel of this.audioLevelCheckers.values()) {
         audioLevel.stopChecking();
      }

      for (const audioPlayer of this.audioSourcePlayers) {
         audioPlayer.stop();
      }

      this.audioSourcePlayers.splice(0, this.audioSourcePlayers.length);
      this.audioLevelCheckers.clear();

      if (environment === "android") {
         await this.forgroundServiceListener?.remove();
         await ForegroundService.stopForegroundService();
         await NativeMediaDevices.stopCommunication();
      }
   }

   private async handleConsumerCreated(consumer: Consumer<MediasoupAppData>) {
      if (consumer.appData.mediaKind === "microphone") {
         const store = voiceStore.getState();

         const { userId, mediaKind } = consumer.appData;

         const existingAudioLevel = this.audioLevelCheckers.get(userId);
         if (existingAudioLevel) {
            existingAudioLevel.stopChecking();
            this.audioLevelCheckers.delete(userId);
         }

         const audioLevel = new AudioLevelChecker(consumer.producerId, consumer.id, userId, mediaKind);
         this.audioLevelCheckers.set(userId, audioLevel);

         await audioLevel.startChecking(new MediaStream([consumer.track]));
         audioLevel.onAudioLevel = (db: number) => {
            // not -100 because it sometimes start at ~ -98
            const speaking = db > -95;
            store.updateSpeakingState(userId, speaking);
         };
      }

      // Just a little side check because when a new user joins, the consumer will start playing even if i'm deafened
      if (this.client.voiceManager.voiceState.gatewayVoiceState.isAudioDeafened) {
         consumer.pause();
      }

      await this.refreshConsumerAudioPlayers();
   }

   private async handleRemoteProducerCreated(data: ProducerData): Promise<void> {
      if (data.kind === "camera" || data.kind === "microphone") {
         await this.transport.createConsumer(data.userId, data.kind);
      }

      const consumers = this.transport.getConsumers();

      // If a stream_video exists from this user and we are watching it, consume the audio when it's available
      if (data.kind === "stream_audio" && consumers.some((x) => x.appData.userId === data.userId && x.appData.mediaKind === "stream_video")) {
         await this.transport.createConsumer(data.userId, data.kind);
      }

      // create voice preference for new users
      if (data.kind === "microphone" || data.kind === "stream_audio") {
         const store = clientStore.getState();
         let voicePreferences = store.userSettings?.voicePreferences;
         if (!voicePreferences) voicePreferences = [];

         if (!voicePreferences?.some((x) => x.userId === data.userId)) {
            voicePreferences?.push({ userId: data.userId, microphoneVolume: 100, streamVolume: 100, isMicrophoneMuted: false, isStreamMuted: false });
            store.setUserSettings({ voicePreferences: voicePreferences });
            await this.client.users.editSettings({ voicePreferences: voicePreferences });
         }
      }

      await this.client.voiceManager.applyVoiceState();
   }

   private async handleAnyProducerClosed(data: ProducerData) {
      const voice = voiceStore.getState();

      if (data.kind === "microphone") {
         const audioLevel = this.audioLevelCheckers.get(data.userId);
         audioLevel?.stopChecking();
         this.audioLevelCheckers.delete(data.userId);

         voice.removeSpeakingState(data.userId);
      }

      // Stop loopback capture
      if (data.kind === "stream_audio" && data.userId === this.client?.currentUser?.id) {
         await this.stopAudioLoopback();
      }

      const audioPlayerIndex = this.audioSourcePlayers.findIndex((x) => x.producerId === data.producerId);
      if (audioPlayerIndex !== -1) {
         this.audioSourcePlayers[audioPlayerIndex].stop();
         this.audioSourcePlayers.splice(audioPlayerIndex, 1);
      }
   }

   private handleProducerCreated(producer: Producer<MediasoupAppData>) {
      this.client.checkUser();
      const store = voiceStore.getState();

      // Pause the microphone as soon as it's opened
      if (producer.appData.mediaKind === "microphone") {
         this.client.voiceManager.voiceState.updateLocalVoiceState({ isAudioPaused: true });
         store.updateSpeakingState(this.client.currentUser.id, false);
      }
   }

   private handleStorageUpdated(current: AppSettings, previous: AppSettings) {
      if (this.status !== "ready") {
         return;
      }

      const environment = windowStore.getState().environment;
      const difference = diff(current, previous);

      if (difference.outputVolume) {
         for (const player of this.audioSourcePlayers) {
            player.setGain(difference.outputVolume, undefined);
         }
      }

      if (difference.inputVolume) {
         this.inputDevice.setGain(difference.inputVolume);
      }

      // Start streaming with new input device
      if (difference.inputDeviceId !== undefined || difference.noiseSuppression !== undefined) {
         void this.openOrReplaceMicrophone(current.inputDeviceId, current.inputVolume, current.noiseSuppression, environment);

         // Android needs to replay the audio sources to put them in the communications channel.
         if (environment === "android") void this.refreshConsumerAudioPlayers();
      }

      // Change sink id of audio players
      if (difference.outputDeviceId && environment !== "android") {
         for (const player of this.audioSourcePlayers) {
            player.setSinkId(difference.outputDeviceId);
         }
      }
   }

   private handleVoicePreferenceUpdated(current: VoicePreference[] | undefined) {
      for (const player of this.audioSourcePlayers) {
         const userPreference = current?.find((x) => x.userId === player.userId);

         if (!userPreference) {
            throw new Error(`Voice preference for user ${player.userId} was not found`);
         }

         const microphonePlayer = this.audioSourcePlayers.find((x) => x.kind === "microphone" && x.userId === player.userId);
         const streamAudioPlayer = this.audioSourcePlayers.find((x) => x.kind === "stream_audio" && x.userId === player.userId);

         if (microphonePlayer) {
            microphonePlayer.setGain(undefined, userPreference.microphoneVolume);
         }

         if (streamAudioPlayer) {
            streamAudioPlayer.setGain(undefined, userPreference.streamVolume);
         }
      }

      this.client.voiceManager.voiceState.updateVoicePreferences(current ?? []);
   }

   private async refreshConsumerAudioPlayers() {
      await this.microphoneReady;

      const consumers = this.transport.getConsumers();
      const storage = storageStore.getState();
      const voicePreferences = clientStore.getState().userSettings?.voicePreferences;
      const settings = storage.getCachedValue("settings");

      // Remove old players
      for (const player of this.audioSourcePlayers) {
         player.stop();
      }
      this.audioSourcePlayers.splice(0, this.audioSourcePlayers.length);

      // Initialize new players
      for (const consumer of consumers) {
         if (consumer.kind === "video" || !consumer.track) {
            continue;
         }

         const sourcePlayer = new AudioSourcePlayer(
            new MediaStream([consumer.track]),
            consumer.producerId,
            consumer.appData.userId,
            consumer.appData.mediaKind,
         );
         sourcePlayer.setGain(settings.outputVolume, undefined);

         this.audioSourcePlayers.push(sourcePlayer);

         const preference = voicePreferences?.find((x) => x.userId === consumer.appData.userId);
         if (!preference) throw new Error(`Voice preference for ${consumer.appData.userId} was not found`);

         if (consumer.appData.mediaKind === "microphone") sourcePlayer.setGain(undefined, preference?.microphoneVolume);
         // stream_audio
         else sourcePlayer.setGain(undefined, preference?.streamVolume);
      }
   }

   private async openOrReplaceMicrophone(microphoneDeviceId: string, microphoneVolume: number, noiseSuppression: boolean, environment: Environment) {
      const streamPromise = this.inputDevice.getStream(environment === "android" ? "" : microphoneDeviceId, microphoneVolume, noiseSuppression);
      this.microphoneReady = streamPromise.then(() => undefined);

      const otherStream = await streamPromise;
      // const otherStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = otherStream.getAudioTracks()[0].clone();

      try {
         const producer = this.transport.getProducer("microphone");
         if (producer && producer.track !== audioTrack) {
            await this.device.replaceMicrophoneTrack(audioTrack);
         } else if (!producer) {
            await this.device.openMicrophone(audioTrack);
         }

         // Level checking reads from the same stable output stream.
         await this.inputDevice.initializeAudioLevel(this.client);
      } catch (e) {
         this.inputDevice.close();
         throw e;
      }
   }

   public async startAudioLoopback(mode: "system" | "application", processId?: number) {
      if (!window.electronAPI) return;

      window.electronAPI.startAudioLoopback(mode, processId);

      const { sampleRate, numChannels } = { sampleRate: 48000, numChannels: 2 };
      /* @ts-ignore */
      const audioGenerator = new MediaStreamTrackGenerator({ kind: "audio" });
      const writer: WritableStreamDefaultWriter = audioGenerator.writable.getWriter();

      this.loopbackDataUnlisten?.();
      /* v8 ignore next */
      this.loopbackDataUnlisten = window.electronAPI.onLoopbackData(async (_, d) => {
         const float32 = new Float32Array(d.length / 2);
         const view = new DataView(d.buffer);
         for (let i = 0; i < float32.length; i++) {
            float32[i] = view.getInt16(i * 2, true) / 32768;
         }

         const audioData = new AudioData({
            format: "f32",
            sampleRate,
            numberOfFrames: float32.length / numChannels,
            numberOfChannels: numChannels,
            timestamp: performance.now() * 1000, // In microseconds
            data: float32,
         });

         try {
            await writer.write(audioData);
            // oxlint-disable-next-line no-unused-vars
         } catch (e) {
            this.stopAudioLoopback();
         }
      });

      const track = new MediaStream([audioGenerator]).getAudioTracks()[0];
      return track;
   }

   public async stopAudioLoopback() {
      if (window.electronAPI) {
         await window.electronAPI.stopAudioLoopback();
         this.loopbackDataUnlisten?.();
      }
   }

   private async registerForegroundServiceListeners() {
      const listener = await ForegroundService.addListener("buttonClicked", (e) => {
         if (e.buttonId === 1) {
            VoiceClient.sendMessage("toggle_mute");
         } else if (e.buttonId === 2) {
            VoiceClient.sendMessage("toggle_deafen");
         } else if (e.buttonId === 3) {
            VoiceClient.sendMessage("disconnect_voice");
         }
      });

      this.forgroundServiceListener = listener;
   }
}
