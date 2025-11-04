import { log } from "@huginn/shared";
import { AudioLevelChecker } from "./audio-level-checker";
import { storageStore } from "@stores/storageStore";
import { voiceStore } from "@stores/voiceStore";
import type { HuginnClient } from "@huginn/api";

export class VoiceInputDevice {
   public currentStream?: MediaStream;
   public dummyInput?: VoiceInputDevice;
   private gainNode?: GainNode;
   private audioContext?: AudioContext;
   private destination?: MediaStreamAudioDestinationNode;
   private source?: MediaStreamAudioSourceNode;
   private options?: { deviceId: string; volumePercentage: number; noiseSuppression: boolean };
   private client: HuginnClient;

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

      const audioLevel = new AudioLevelChecker();
      await audioLevel.startChecking(stream);
      audioLevel.offAll("audio-level");
      audioLevel.on("audio-level", (db) => onLocalAudioLevel(this.client, db));

      const tolerance = 0;
      let timeout: number | undefined;
      let lastState = true;
      function onLocalAudioLevel(client: HuginnClient, db: number) {
         const settings = storageStore.getState().getCachedValue("settings");

         const userId = client?.currentUser?.id ?? "";
         if (db > settings.inputThreshold) {
            const voice = voiceStore.getState();

            lastState = true;

            if (timeout) {
               return;
            }

            clearTimeout(timeout);
            timeout = window.setTimeout(() => {
               if (!lastState) {
                  client.voiceManager.voiceState.updateLocalVoiceState({ isAudioPaused: true });
                  voice.updateSpeakingState(userId, false);
               }
               timeout = undefined;
            }, 700);

            if (client?.voiceManager.voiceState.localVoiceState.isAudioPaused) {
               client.voiceManager.voiceState.updateLocalVoiceState({ isAudioPaused: false });

               if (!client.voiceManager.voiceState.gatewayVoiceState.isAudioMuted) {
                  voice.updateSpeakingState(userId, true);
               }
            }
         } else if (db <= settings.inputThreshold - tolerance) {
            lastState = false;
         }
      }

      return { audioLevel, stream };
   }
}
