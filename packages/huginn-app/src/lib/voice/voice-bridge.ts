import { HuginnClient, Voice, type VoiceOptions } from "@huginn/api";
import { diff, log, type MediasoupAppData, type ProducerData, type Snowflake } from "@huginn/shared";
import { storageStore } from "@stores/storageStore";
import { voiceStore } from "@stores/voiceStore";
import { AudioLevelChecker } from "./audio-level-checker";
import type { AppSettings, VoicePreference } from "@/types";
import { AudioSourcePlayer } from "./audio-source-player";
import { VoiceInputDevice } from "./voice-input-device";
import type { Consumer, Producer } from "mediasoup-client/types";
import { produce } from "immer";
import { VoiceDebugger } from "./voice-debugger";

export class VoiceBridge extends Voice {
   public readonly audioSourcePlayers: AudioSourcePlayer[];
   public readonly audioLevelCheckers: Map<Snowflake, AudioLevelChecker>;
   public readonly inputDevice: VoiceInputDevice;
   private loopbackDataUnlisten?: () => void;
   public readonly debugger: VoiceDebugger;

   public constructor(client: HuginnClient, options?: Partial<VoiceOptions>) {
      super(client, options);

      this.audioLevelCheckers = new Map();
      this.audioSourcePlayers = [];
      this.inputDevice = new VoiceInputDevice(client);
      this.debugger = new VoiceDebugger(client as HuginnClient<VoiceBridge>);

      this.on("ready", async () => await this.onReady());
      this.on("reset", async () => await this.onReset());

      this.transport.on("consumer_created", async (d) => await this.onConsumerCreated(d));

      this.transport.on("producer_created", (d) => this.onProducerCreated(d));
      this.transport.on("remote_producer_created", async (d) => await this.onRemoteProducerCreated(d));

      this.transport.on("producer_closed", async (d) => await this.onAnyProducerClosed(d));
      this.transport.on("remote_producer_closed", async (d) => await this.onAnyProducerClosed(d));

      storageStore.subscribe(
         (state) => state.cache.settings,
         (current, old) => this.onStorageUpdated(current, old),
      );
   }

   private async onReady() {
      const settings = storageStore.getState().getCachedValue("settings");

      // Initialize the actual audio sending stream
      await this.openOrReplaceMicrophone(settings.inputDeviceId, settings.inputVolume, settings.noiseSuppression);
   }

   private async onReset() {
      // this.debugger.closeDebugger();
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

   private async onConsumerCreated(consumer: Consumer<MediasoupAppData>) {
      if (consumer.appData.mediaKind === "microphone") {
         const store = voiceStore.getState();

         const audioLevel = new AudioLevelChecker(consumer.id, consumer.appData.userId, consumer.appData.mediaKind);
         this.audioLevelCheckers.set(consumer.appData.userId, audioLevel);

         await audioLevel.startChecking(new MediaStream([consumer.track]));
         audioLevel.on("audio-level", (db: number) => {
            // not -100 because it sometimes start at ~ -98
            const speaking = db > -95;
            store.updateSpeakingState(consumer.appData.userId, speaking);
         });
      }

      // Just a little side check because when a new user joins, the consumer will start playing even if i'm deafened
      if (this.client.voiceManager.voiceState.gatewayVoiceState.isAudioDeafened) {
         consumer.pause();
      }

      this.refreshConsumerAudioPlayers();
   }

   private async onRemoteProducerCreated(data: ProducerData): Promise<void> {
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
         const storage = storageStore.getState();
         const voicePreferences = storage.getCachedValue("voice-preferences");

         if (!voicePreferences.some((x) => x.userId === data.userId)) {
            this.updateVoicePreference(data.userId, { microphoneVolume: 100, streamVolume: 100 });
            await storage.saveFromCachedValue("voice-preferences");
         }
      }
   }

   private async onAnyProducerClosed(data: ProducerData) {
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

   private onProducerCreated(producer: Producer<MediasoupAppData>) {
      this.client.checkUser();
      const store = voiceStore.getState();

      // Pause the microphone as soon as it's opened
      if (producer.appData.mediaKind === "microphone") {
         this.client.voiceManager.voiceState.updateLocalVoiceState({ isAudioPaused: true });
         store.updateSpeakingState(this.client.currentUser.id, false);
      }
   }

   private onStorageUpdated(current: AppSettings, previous: AppSettings) {
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

   private refreshConsumerAudioPlayers() {
      const consumers = this.transport.getConsumers();
      const storage = storageStore.getState();
      const voicePreferences = storage.getCachedValue("voice-preferences");
      const settings = storage.getCachedValue("settings");

      log("app:voice-bridge", "default", "refresh consumer audio players", "ovol:", settings.outputVolume, "ncons:", consumers.length);

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

         const preference = voicePreferences.find((x) => x.userId === consumer.appData.userId);
         if (!preference) throw new Error(`Voice preference for ${consumer.appData.userId} was not found`);

         if (consumer.appData.mediaKind === "microphone") {
            sourcePlayer.setGain(undefined, preference?.microphoneVolume);
         } else if (consumer.appData.mediaKind === "stream_audio") {
            sourcePlayer.setGain(undefined, preference?.streamVolume);
         }
      }
   }

   private async openOrReplaceMicrophone(microphoneDeviceId: string, microphoneVolume: number, noiseSuppression: boolean) {
      log("app:voice-bridge", "default", "open microphone", "did:", microphoneDeviceId, "vol:", microphoneVolume, "ns:", noiseSuppression);

      const otherStream = await this.inputDevice.getStream(microphoneDeviceId, microphoneVolume, noiseSuppression);
      const audioTrack = otherStream.getAudioTracks()[0];

      if (this.transport.getProducer("microphone")) {
         await this.device.replaceMicrophoneTrack(audioTrack);
      } else {
         await this.device.openMicrophone(audioTrack);
      }

      // Initialize audio level checking with a dummy stream to avoid causing an infinite mute on the actual "send" mic stream
      await this.inputDevice.initializeAudioLevel();
   }

   public async startAudioLoopback(processTitle?: string, processId?: string) {
      log("app:voice-bridge", "default", "start audio loopback", "ptit:", processTitle, "pid:", processId);

      if (!window.electronAPI) {
         return;
      }

      const result = await window.electronAPI.startAudioLoopback(processTitle, processId);

      if (!result) throw new Error(`Process audio loopback with title: ${processTitle} or id: ${processId} failed`);

      const { sampleRate, numChannels } = { sampleRate: 48000, numChannels: 2 };
      /* @ts-ignore */
      const audioGenerator = new MediaStreamTrackGenerator({ kind: "audio" });
      const writer: WritableStreamDefaultWriter = audioGenerator.writable.getWriter();

      this.loopbackDataUnlisten?.();
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
      log("app:voice-bridge", "default", "stop audio loopback");

      if (window.electronAPI) {
         await window.electronAPI.stopAudioLoopback();
         this.loopbackDataUnlisten?.();
      }
   }

   public updateVoicePreference(userId: Snowflake, options: { microphoneVolume?: number; streamVolume?: number }) {
      log("app:voice-bridge", "voice-preference", "update", "uid:", userId, "opts:", JSON.stringify(options));

      const voicePreferences = storageStore.getState().getCachedValue("voice-preferences");
      const updatedVoicePreferences = produce(voicePreferences, (draft) => {
         const existingIndex = draft.findIndex((x) => x.userId === userId);
         if (existingIndex !== -1) {
            draft[existingIndex] = { ...draft[existingIndex], ...options };
         } else {
            if (!options.microphoneVolume || !options.streamVolume) {
               throw new Error("Creating new voice preference requires both microphone and screen share volumes");
            }

            draft.push({
               userId,
               microphoneVolume: options.microphoneVolume,
               streamVolume: options.streamVolume,
            });
         }
      });

      storageStore.getState().setCachedValue("voice-preferences", updatedVoicePreferences);

      const userPreference = updatedVoicePreferences.find((x) => x.userId === userId);
      const microphonePlayer = this.audioSourcePlayers.find((x) => x.kind === "microphone" && x.userId === userId);
      const streamAudioPlayer = this.audioSourcePlayers.find((x) => x.kind === "stream_audio" && x.userId === userId);

      if (!userPreference) throw new Error(`User preference for user ${userId} was not found`);

      if (microphonePlayer) {
         microphonePlayer.setGain(undefined, userPreference.microphoneVolume);
      }

      if (streamAudioPlayer) {
         streamAudioPlayer.setGain(undefined, userPreference.streamVolume);
      }
   }
}
