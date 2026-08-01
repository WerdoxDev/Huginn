import type { Consumer, Producer, Transport } from "mediasoup-client/types";

import { HuginnClient, Voice, type VoiceOptions } from "@huginnjs/api";
import { diff, type MediasoupAppData, type ProducerData, type Snowflake, type VoicePreference } from "@huginnjs/shared";
import { clientStore } from "@stores/clientStore";
import { storageStore } from "@stores/storageStore";
import { voiceStore } from "@stores/voiceStore";

import type { AppSettings } from "@/types";

import { AudioLevelChecker } from "./audio-level-checker";
import { AudioSourcePlayer } from "./audio-source-player";
import { VoiceDebugger } from "./voice-debugger";
import { VoiceHost } from "./voice-host";
import { VoiceInputDevice } from "./voice-input-device";
import { VoicePopout } from "./voice-popout";
import { getVoiceHostId } from "./voice-window";

export class VoiceBridge extends Voice {
   public readonly audioSourcePlayers: AudioSourcePlayer[] = [];
   // Map<producerId, ALC>
   public readonly audioLevelCheckers = new Map<Snowflake, AudioLevelChecker>();
   public readonly inputDevice: VoiceInputDevice;
   private loopbackDataUnlisten?: () => void;
   public readonly debugger: VoiceDebugger;
   public readonly popout?: VoicePopout;
   public readonly host?: VoiceHost;

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

      this.inputDevice = new VoiceInputDevice(client);
      this.debugger = new VoiceDebugger(client as HuginnClient<VoiceBridge>);

      if (window.opener) return;

      const hostId = getVoiceHostId();
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

      // Initialize the actual audio sending stream
      await this.openOrReplaceMicrophone(settings.inputDeviceId, settings.inputVolume, settings.noiseSuppression);
   }

   private async handleReset() {
      this.inputDevice.close();
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

      this.refreshConsumerAudioPlayers();
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
      if (difference.inputDeviceId || difference.noiseSuppression) {
         this.openOrReplaceMicrophone(current.inputDeviceId, current.inputVolume, current.noiseSuppression);
      }

      // Change sink id of audio players
      if (difference.outputDeviceId) {
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

   private refreshConsumerAudioPlayers() {
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

   private async openOrReplaceMicrophone(microphoneDeviceId: string, microphoneVolume: number, noiseSuppression: boolean) {
      const otherStream = await this.inputDevice.getStream(microphoneDeviceId, microphoneVolume, noiseSuppression);
      const audioTrack = otherStream.getAudioTracks()[0];

      try {
         if (this.transport.getProducer("microphone")) {
            await this.device.replaceMicrophoneTrack(audioTrack);
         } else {
            await this.device.openMicrophone(audioTrack);
         }

         // Initialize audio level checking with a dummy stream to avoid causing an infinite mute on the actual "send" mic stream
         await this.inputDevice.initializeAudioLevel();
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
}
