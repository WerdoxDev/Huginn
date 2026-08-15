import type { HuginnClient } from "@huginnjs/api";

import { storageStore } from "@stores/storageStore";
import { voiceStore } from "@stores/voiceStore";
import { windowStore } from "@stores/windowStore";

import { AudioLevelChecker } from "./audio-level-checker";

type VoiceInputOptions = {
   deviceId: string;
   noiseSuppression: boolean;
};

export class VoiceInputDevice {
   public static currentStream?: MediaStream;
   private static gainNode?: GainNode;
   private static audioContext?: AudioContext;
   private static destination?: MediaStreamAudioDestinationNode;
   private static source?: MediaStreamAudioSourceNode;
   private static options?: VoiceInputOptions;
   private static audioLevel?: AudioLevelChecker;
   private static openingPromise?: Promise<void>;
   private static generation = 0;
   private static users = new Set<symbol>();

   private constructor() {}

   public static acquire() {
      const token = Symbol();
      this.users.add(token);

      let released = false;

      return () => {
         if (released) return;
         released = true;

         this.users.delete(token);
         if (this.users.size === 0) this.close();
      };
   }

   public static async getStream(deviceId: string, volumePercentage: number, noiseSuppression: boolean): Promise<MediaStream> {
      const isMobileEnvironment = windowStore.getState().environment === "android";
      const requestedOptions = {
         deviceId: isMobileEnvironment ? "" : deviceId,
         noiseSuppression,
      };

      if (this.openingPromise) {
         console.log("WAITING FOR OPENING PROMISE");
         await this.openingPromise;
      }

      this.ensureAudioGraph();

      if (!this.currentStream || !this.hasSameOptions(requestedOptions)) {
         const generation = this.generation;
         const openingPromise = this.replaceInputStream(requestedOptions, isMobileEnvironment, generation);
         this.openingPromise = openingPromise;

         try {
            await openingPromise;
         } finally {
            if (this.openingPromise === openingPromise) this.openingPromise = undefined;
         }
      }

      if (!this.destination || !this.gainNode) throw new Error("The voice input was closed before it finished opening.");

      this.source?.connect(this.gainNode);
      this.setGain(volumePercentage);

      await this.audioContext?.resume();

      console.log("GET STREAM");
      return this.destination.stream;
   }

   /** Globally closes the shared input and every consumer of its output stream. */
   public static close() {
      this.generation += 1;

      this.stopAudioLevel();
      this.stopStream(this.currentStream);
      this.stopStream(this.destination?.stream);

      this.source?.disconnect();
      this.gainNode?.disconnect();
      this.destination?.disconnect();
      void this.audioContext?.close();

      this.currentStream = undefined;
      this.source = undefined;
      this.gainNode = undefined;
      this.destination = undefined;
      this.audioContext = undefined;
      this.options = undefined;
      this.openingPromise = undefined;
   }

   public static setGain(volumePercentage: number) {
      if (this.gainNode) this.gainNode.gain.value = volumePercentage / 100;
   }

   private static stopAudioLevel() {
      this.audioLevel?.stopChecking();
      this.audioLevel = undefined;
   }

   public static async initializeAudioLevel(client: HuginnClient) {
      if (!this.destination) {
         throw new Error("The voice input must be opened before audio-level checking can be initialized.");
      }

      this.stopAudioLevel();

      const track = this.destination.stream.getAudioTracks()[0].clone();
      track.enabled = true;
      const stream = new MediaStream([track]);

      this.audioLevel = new AudioLevelChecker();
      void this.audioLevel.startChecking(stream);
      this.audioLevel.onAudioLevel = (db) => handleAudioLevel(client, db);

      let speaking = false;
      let hangoverUntil = 0;
      let lastMuteState = false;

      function setSpeaking(voice: ReturnType<typeof voiceStore.getState>, userId: string, value: boolean) {
         if (speaking === value) return;

         speaking = value;
         client.voiceManager.voiceState.updateLocalVoiceState({
            isAudioPaused: !value,
         });
         voice.updateSpeakingState(userId, value);
      }

      function handleAudioLevel(client: HuginnClient, db: number) {
         const settings = storageStore.getState().getCachedValue("settings");

         const OPEN_DB = settings.inputThreshold;
         const CLOSE_DB = settings.inputThreshold - 10; // hysteresis gap
         const HANGOVER_MS = 50;

         const voice = voiceStore.getState();
         const userId = client.currentUser?.id ?? "";
         const isMuted = client.voiceManager.voiceState.gatewayVoiceState.isAudioMuted ?? false;

         const now = performance.now();

         /* ---------------- MUTE HANDLING ---------------- */

         if (isMuted !== lastMuteState) {
            lastMuteState = isMuted;

            if (isMuted) setSpeaking(voice, userId, false);
            return;
         }

         if (isMuted) return;

         /* ---------------- VAD LOGIC ---------------- */

         if (!speaking) {
            // SILENT → VOICE
            if (db >= OPEN_DB) {
               hangoverUntil = now + HANGOVER_MS;
               setSpeaking(voice, userId, true);
            }
         } else {
            // VOICE → SILENT (with hysteresis + hangover)
            if (db >= CLOSE_DB) {
               hangoverUntil = now + HANGOVER_MS;
            } else if (now > hangoverUntil) {
               setSpeaking(voice, userId, false);
            }
         }
      }
   }

   private static ensureAudioGraph() {
      if (this.audioContext && this.gainNode && this.destination) return;

      const audioContext = new AudioContext({ latencyHint: "interactive" });
      const gainNode = audioContext.createGain();
      const destination = audioContext.createMediaStreamDestination();

      gainNode.connect(destination);

      this.audioContext = audioContext;
      this.gainNode = gainNode;
      this.destination = destination;
   }

   private static async replaceInputStream(options: VoiceInputOptions, isMobileEnvironment: boolean, generation: number) {
      this.source?.disconnect();
      this.stopStream(this.currentStream);

      this.source = undefined;
      this.currentStream = undefined;
      this.options = undefined;

      const audioConstraints: MediaTrackConstraints = {
         ...(!isMobileEnvironment && options.deviceId ? { deviceId: options.deviceId } : {}),
         sampleRate: 48000,
         channelCount: isMobileEnvironment ? 1 : 2,
         echoCancellation: true,
         noiseSuppression: options.noiseSuppression,
         autoGainControl: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      if (generation !== this.generation || !this.audioContext || !this.gainNode) {
         console.log(generation, this.generation, this.audioContext, this.gainNode);
         this.stopStream(stream);
         // return false;
         throw new Error("The voice input was closed before it finished opening.");
      }

      try {
         const source = this.audioContext.createMediaStreamSource(stream);

         this.currentStream = stream;
         this.source = source;
         this.options = options;
      } catch (error) {
         this.stopStream(stream);
         throw error;
      }
   }

   private static hasSameOptions(requested: VoiceInputOptions) {
      return this.options?.deviceId === requested.deviceId && this.options.noiseSuppression === requested.noiseSuppression;
   }

   private static stopStream(stream?: MediaStream) {
      for (const track of stream?.getTracks() ?? []) track.stop();
   }
}
