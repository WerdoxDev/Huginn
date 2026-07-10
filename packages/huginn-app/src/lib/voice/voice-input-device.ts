import type { HuginnClient } from "@huginn/api";

import { log } from "@huginn/shared";
import { storageStore } from "@stores/storageStore";
import { voiceStore } from "@stores/voiceStore";

import { AudioLevelChecker } from "./audio-level-checker";

export class VoiceInputDevice {
   public currentStream?: MediaStream;
   public dummyInput?: VoiceInputDevice;
   private gainNode?: GainNode;
   private audioContext?: AudioContext;
   private destination?: MediaStreamAudioDestinationNode;
   private source?: MediaStreamAudioSourceNode;
   private options?: { deviceId: string; volumePercentage: number; noiseSuppression: boolean };
   private client: HuginnClient;
   private audioLevel?: AudioLevelChecker;

   public constructor(client: HuginnClient) {
      this.client = client;
   }

   public async getStream(deviceId: string, volumePercentage: number, noiseSuppression: boolean) {
      log("app:voice-input-device", "default", "get stream", "did:", deviceId, "vp:", volumePercentage, "ns:", noiseSuppression);

      this.options = { deviceId, volumePercentage, noiseSuppression };

      const audioConstraints: MediaTrackConstraints = {
         deviceId: deviceId,
         sampleRate: 48000,
         channelCount: 2,
         echoCancellation: noiseSuppression,
         noiseSuppression: noiseSuppression,
         autoGainControl: false,
      };

      if (this.currentStream) {
         this.gainNode?.disconnect();
         this.destination?.disconnect();
         this.source?.disconnect();
         this.audioContext?.close();

         this.audioContext = undefined;
         this.destination = undefined;
         this.gainNode = undefined;
         this.source = undefined;

         const track = this.currentStream.getAudioTracks()[0];
         track.stop();
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
         audio: audioConstraints,
      });

      this.currentStream = newStream;

      this.audioContext = new AudioContext();
      this.source = this.audioContext.createMediaStreamSource(this.currentStream);

      this.gainNode = this.audioContext.createGain();
      this.setGain(volumePercentage);

      this.source.connect(this.gainNode);

      this.destination = this.audioContext.createMediaStreamDestination();
      this.gainNode.connect(this.destination);

      return this.destination.stream;
   }

   public close() {
      if (this.destination) {
         for (const track of this.destination.stream.getTracks()) {
            track.stop();
         }
      }

      if (this.currentStream) {
         for (const track of this.currentStream.getTracks()) {
            track.stop();
         }
      }

      this.dummyInput?.close();
   }

   public setGain(volumePercentage: number) {
      log("app:voice-input-device", "default", "set gain", "vp:", volumePercentage);

      if (this.gainNode) {
         this.gainNode.gain.value = volumePercentage / 100;
         this.dummyInput?.setGain(volumePercentage);
      }
      if (this.options) {
         this.options.volumePercentage = volumePercentage;
      }
   }

   public async initializeAudioLevel() {
      log("app:voice-input-device", "default", "initialize local audio level checker");

      if (!this.dummyInput) {
         this.dummyInput = new VoiceInputDevice(this.client);
      }

      const stream = await this.dummyInput.getStream(this.options!.deviceId, this.options!.volumePercentage, this.options!.noiseSuppression);

      if (this.audioLevel) {
         this.audioLevel.stopChecking();
      }

      this.audioLevel = new AudioLevelChecker();
      this.audioLevel.startChecking(stream);
      this.audioLevel.onAudioLevel = (db) => handleAudioLevel(this.client, db);

      let speaking = false;
      let hangoverUntil = 0;
      let lastMuteState = false;

      function setSpeaking(client: HuginnClient, voice: ReturnType<typeof voiceStore.getState>, userId: string, value: boolean) {
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
         const userId = client?.currentUser?.id ?? "";
         const isMuted = client?.voiceManager.voiceState.gatewayVoiceState.isAudioMuted ?? false;

         const now = performance.now();

         /* ---------------- MUTE HANDLING ---------------- */

         if (isMuted !== lastMuteState) {
            lastMuteState = isMuted;

            if (isMuted) {
               setSpeaking(client, voice, userId, false);
            }
            return;
         }

         if (isMuted) return;

         /* ---------------- VAD LOGIC ---------------- */

         if (!speaking) {
            // SILENT → VOICE
            if (db >= OPEN_DB) {
               hangoverUntil = now + HANGOVER_MS;
               setSpeaking(client, voice, userId, true);
            }
         } else {
            // VOICE → SILENT (with hysteresis + hangover)
            if (db >= CLOSE_DB) {
               hangoverUntil = now + HANGOVER_MS;
            } else if (now > hangoverUntil) {
               setSpeaking(client, voice, userId, false);
            }
         }
      }
   }
}
