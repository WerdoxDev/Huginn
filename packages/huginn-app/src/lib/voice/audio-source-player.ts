import type { HMediaKind, Snowflake } from "@huginn/shared";
import { settingsStore } from "@stores/settingsStore";

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
