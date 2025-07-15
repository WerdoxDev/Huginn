import { log } from "@huginn/shared";
import { client } from "@stores/clientStore";
import { settingsStore } from "@stores/settingsStore";
import { voiceStore } from "@stores/voiceStore";
import type { RemoteSource, VoicePreference } from "@/types";
import { listenEvent } from "../event-handler";
import { AudioLevelChecker } from "./audio-level-checker";
import { AudioSourcePlayer } from "./audio-source-player";
import { VoiceInputDevice } from "./voice-input-device";

export class VoiceClient {
   private audioSourcePlayers: AudioSourcePlayer[];
   private inputDevice?: VoiceInputDevice;
   private dummyInputDevice?: VoiceInputDevice;
   private loopbackDataUnlisten?: () => void;

   public constructor() {
      this.audioSourcePlayers = [];
   }

   public listenToVoiceEvents() {
      log("app:voice-client", "default", "initializing");

      const unlisteners: Array<(() => void) | undefined> = [];

      if (!client) {
         return;
      }

      // Get local mic stream when transport is ready
      unlisteners.push(client.voice.listen("send_transport_ready", async (d) => {
         log("app:voice-client", "voice-recv", "send transport ready", "cid:", d.channelId);

         if (!client?.user?.id) {
            return;
         }

         const settings = settingsStore.getState();

         // Initialize audio level checking with a dummy stream to avoid causing an infinite mute on the actual "send" mic stream
         const { audioLevel, stream: micStream } = await this.initLocalAudioLevel(settings.inputDeviceId, settings.inputVolume, settings.noiseSuppression);

         // Initialize the actual audio sending stream
         await this.initStreaming(settings.inputDeviceId, settings.inputVolume, settings.noiseSuppression);

         // Add local microphone remote source
         const producer = client.voice.producers.get("microphone");
         if (producer) {
            voiceStore.getState().addRemoteSource(client.user.id, undefined, producer.id, producer.appData.mediaKind, micStream, audioLevel);
         }

      }));

      // Add remote source when a new consumer is created
      unlisteners.push(client.voice.listen("local_consumer_created", async (d) => {
         log("app:voice-client", "voice-recv", "consumer created", "cid:", d.consumerId, "pid:", d.producerId, "uid:", d.producerUserId, "mk:", d.kind);

         const remoteStream = new MediaStream([d.track]);

         const voice = voiceStore.getState();

         if (d.track.kind === "audio") {
            let audioLevel: AudioLevelChecker | undefined;
            if (d.kind === "microphone") {
               audioLevel = await this.startAudioLevel(remoteStream, d.producerUserId);
            }

            voice.addRemoteSource(d.producerUserId, d.consumerId, d.producerId, d.kind, remoteStream, audioLevel);
         } else {
            voice.addRemoteSource(d.producerUserId, d.consumerId, d.producerId, d.kind, remoteStream);
         }

         const settings = settingsStore.getState();

         // Initialize remote audio source players (updatedVoice is because getState only returns an snapshot and doesn't change)
         const updatedVoice = voiceStore.getState();
         this.initRemoteAudioSourcePlayers(updatedVoice.remoteSources, updatedVoice.voicePreferences, settings.outputVolume);
      }));

      // Remove remote source when a producer is closed
      unlisteners.push(client.voice.listen("producer_closed", (d) => {
         log("app:voice-client", "voice-recv", "producer closed", "pid:", d.producerId, "uid:", d.userId);

         const voice = voiceStore.getState();

         voice.removeRemoteSource(d.producerId);

         const producer = voice.remoteSources.find((x) => x.producerId === d.producerId);
         if (producer) {

            if (producer.kind === "microphone") {
               voice.removeSpeakingState(producer.userId);
            }

            // Stop loopback capture
            if (producer.kind === "screen_video" && producer.userId === client?.user?.id) {
               this.stopAudioLoopback();
            }
         }

         const audioPlayerIndex = this.audioSourcePlayers.findIndex((x) => x.producerId === d.producerId);
         if (audioPlayerIndex !== -1) {
            this.audioSourcePlayers[audioPlayerIndex].stop();
            this.audioSourcePlayers.splice(audioPlayerIndex, 1);
         }
      }));

      // Reset speaking and remote sources and stop audio loopback
      unlisteners.push(client.voice.listen("close", () => {
         log("app:voice-client", "voice-recv", "disconnected");

         voiceStore.getState().clearRemoteSources();
         voiceStore.getState().clearSpeakingStates();

         this.stopAudioLoopback();
      }));

      // pause audio immediately after the local producer is created
      unlisteners.push(client.voice.listen("local_producer_created", (d) => {
         log("app:voice-client", "voice-recv", "local producer created", "pid:", d.producerId, "mk:", d.kind);

         if (!client?.user) {
            return;
         }

         const store = voiceStore.getState();

         // Pause the microphone as soon as it's opened
         if (d.kind === "microphone") {
            client.voice.updateLocalVoiceState({ audioPaused: true })
            store.updateSpeakingState(client.user.id, false);
         }

         if (d.kind === "screen_video") {
            const stream = new MediaStream([d.track]);

            store.addRemoteSource(client.user.id, undefined, d.producerId, d.kind, stream);
         }
      }));

      // update local the remote source when it's changed
      unlisteners.push(client.voice.listen("local_producer_changed", (d) => {
         log("app:voice-client", "voice-recv", "local producer changed", "pid:", d.producerId, "mk:", d.kind);

         const store = voiceStore.getState();

         if (d.kind === "screen_video" && d.track) {
            const stream = new MediaStream([d.track]);
            store.updateRemoteSource(d.producerId, stream);
         }
      }))

      // update volume for stream and microphone audio of local consumers
      unlisteners.push(listenEvent("voice_preference_changed", (d) => {
         log("app:voice-client", "emitter-recv", "voice preference changed", "uid:", d.userId);

         const store = voiceStore.getState();
         const preference = store.voicePreferences.find((x) => x.userId === d.userId);
         const microphonePlayer = this.audioSourcePlayers.find((x) => x.userId === d.userId && x.kind === "microphone");
         const screensharePlayer = this.audioSourcePlayers.find((x) => x.userId === d.userId && x.kind === "screen_audio");

         if (!preference || (!microphonePlayer && !screensharePlayer)) {
            return;
         }

         if (microphonePlayer) {
            microphonePlayer.setGain(undefined, preference.microphoneVolume);
         }
         if (screensharePlayer) {
            screensharePlayer.setGain(undefined, preference.screenshareVolume);
         }
      }));

      unlisteners.push(settingsStore.subscribe(async (s, old) => {
         log("app:voice-client", "settings-sub", "settings changed");

         if (s.outputVolume !== old.outputVolume) {
            for (const player of this.audioSourcePlayers) {
               player.setGain(s.outputVolume, undefined);
            }
         }

         if (s.inputVolume !== old.inputVolume) {
            this.inputDevice?.setGain(s.inputVolume);
            this.dummyInputDevice?.setGain(s.inputVolume);
         }

         // Start streaming with new input id
         if (s.inputDeviceId !== old.inputDeviceId || s.noiseSuppression !== old.noiseSuppression) {
            await this.initStreaming(s.inputDeviceId, s.inputVolume, s.noiseSuppression);
            await this.initLocalAudioLevel(s.inputDeviceId, s.inputVolume, s.noiseSuppression);
         }

         // Change all remote source's output device id
         if (s.outputDeviceId !== old.outputDeviceId) {
            for (const player of this.audioSourcePlayers) {
               player.setSinkId(s.outputDeviceId);
            }
         }
      }));

      return () => {
         log("app:voice-client", "default", "uninitializing");

         for (const unlisten of unlisteners) {
            unlisten?.();
         }
      };
   }

   private async initLocalAudioLevel(inputDeviceId: string, inputVolume: number, noiseSuppression: boolean) {
      log("app:voice-client", "default", "initialize local audio level checker")

      if (!this.dummyInputDevice) {
         this.dummyInputDevice = new VoiceInputDevice();
      }

      const stream = await this.dummyInputDevice.getStream(inputDeviceId, inputVolume, noiseSuppression);

      const audioLevel = new AudioLevelChecker();
      await audioLevel.startChecking(stream);
      audioLevel.offAll("audio-level");
      audioLevel.on("audio-level", onLocalAudioLevel);

      const tolerance = 0;
      let timeout: number | undefined;
      let lastState = true;
      function onLocalAudioLevel(db: number) {
         const settings = settingsStore.getState();

         const userId = client?.user?.id ?? "";
         if (db > settings.inputThreshold) {
            const voice = voiceStore.getState();

            lastState = true;

            if (timeout) {
               return;
            }

            clearTimeout(timeout);
            timeout = window.setTimeout(() => {
               if (!lastState) {
                  client?.voice.updateLocalVoiceState({ audioPaused: true });
                  // client.voice.pauseMicrophone();
                  voice.updateSpeakingState(userId, false);
               }
               timeout = undefined;
            }, 700);

            if (client?.voice.localVoiceState.audioPaused) {
               client.voice.updateLocalVoiceState({ audioPaused: false });

               if (!client.voice.localVoiceState.audioMuted) {
                  voice.updateSpeakingState(userId, true);
               }
            }
         } else if (db <= settings.inputThreshold - tolerance) {
            lastState = false;
         }
      }

      return { audioLevel, stream };
   }

   private async startAudioLevel(stream: MediaStream, producerId: string) {
      log("app:voice-client", "default", "start audio level checker", "pid:", producerId)

      const store = voiceStore.getState();

      const audioLevel = new AudioLevelChecker();
      await audioLevel.startChecking(stream);
      audioLevel.on("audio-level", (db: number) => {
         // not -100 because it sometimes start at ~ -98
         const speaking = db > -95;
         store.updateSpeakingState(producerId, speaking);
      });

      return audioLevel;
   }

   private async initStreaming(microphoneDeviceId: string, microphoneVolume: number, noiseSuppression: boolean) {
      if (!client?.voice.connectionInfo) {
         return;
      }

      log("app:voice-client", "default", "initialize streaming", "did:", microphoneDeviceId, "vol:", microphoneVolume, "ns:", noiseSuppression)

      if (!this.inputDevice) {
         this.inputDevice = new VoiceInputDevice();
      }

      const otherStream = await this.inputDevice.getStream(microphoneDeviceId, microphoneVolume, noiseSuppression);
      const audioTrack = otherStream.getAudioTracks()[0];
      const videoTrack = otherStream.getVideoTracks()[0];

      await client.voice.startStreaming(undefined, audioTrack);
   }

   /**
    * Initializes all microphone and screen_audio players according to the remote sources
    */
   private initRemoteAudioSourcePlayers(remoteSources: RemoteSource[], voicePreferences: VoicePreference[], outputVolume: number) {
      log("app:voice-client", "default", "initialize audio source players", "ovol:", outputVolume, "nres:", remoteSources.length);

      // Remove old players
      for (const player of this.audioSourcePlayers) {
         player.stop();
      }
      this.audioSourcePlayers.splice(0, this.audioSourcePlayers.length);

      // Initialize new players
      for (const remoteSource of remoteSources) {
         // "Video" sources are not audio
         if (
            remoteSource.userId === client?.user?.id ||
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
            outputVolume
         );
         this.audioSourcePlayers.push(sourcePlayer);

         const preference = voicePreferences.find((x) => x.userId === remoteSource.userId);

         if (remoteSource.kind === "microphone") {
            sourcePlayer.setGain(undefined, preference?.microphoneVolume);
         } else if (remoteSource.kind === "screen_audio") {
            sourcePlayer.setGain(undefined, preference?.screenshareVolume);
         }
      }
   }

   public getAudioTrackFromLoopback(sourceName: string) {
      log("app:voice-client", "default", "get audio track from loopback", "snam:", sourceName)

      if (!window.electronAPI) {
         return;
      }

      window.electronAPI.startAudioLoopback(sourceName);

      const { sampleRate, numChannels } = { sampleRate: 48000, numChannels: 2 };
      /* @ts-ignore */
      const audioGenerator = new MediaStreamTrackGenerator({ kind: 'audio' });
      const writer = audioGenerator.writable.getWriter();

      this.loopbackDataUnlisten?.();
      this.loopbackDataUnlisten = window.electronAPI.onLoopbackData((_, d) => {
         console.log(d.length);
         const float32 = new Float32Array(d.length / 2);
         const view = new DataView(d.buffer);
         for (let i = 0; i < float32.length; i++) {
            float32[i] = view.getInt16(i * 2, true) / 32768;
         }

         const audioData = new AudioData({
            format: 'f32',
            sampleRate,
            numberOfFrames: float32.length / numChannels,
            numberOfChannels: numChannels,
            timestamp: performance.now() * 1000, // In microseconds
            data: float32
         });

         writer.write(audioData);
      });

      const track = new MediaStream([audioGenerator]).getAudioTracks()[0];
      return track;
   }


   public stopAudioLoopback() {
      log("app:voice-client", "default", "stop audio loopback")

      if (window.electronAPI) {
         window.electronAPI.stopAudioLoopback();
         this.loopbackDataUnlisten?.();
      }
   }
}
