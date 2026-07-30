import { type HMediaKind, type Snowflake } from "@huginnjs/shared";
import { storageStore } from "@stores/storageStore";

export class AudioSourcePlayer {
   public readonly gainNode: GainNode;
   public readonly audioContext: AudioContext;
   private audioElement: HTMLAudioElement;
   private abortController: AbortController;
   public readonly producerId: string;
   public readonly userId: Snowflake;
   public readonly kind: HMediaKind;
   public readonly stream: MediaStream;

   public globalGain: number = 1;
   public localGain: number = 1;

   public constructor(stream: MediaStream, producerId: string, userId: Snowflake, kind: HMediaKind) {
      this.producerId = producerId;
      this.userId = userId;
      this.kind = kind;
      this.abortController = new AbortController();

      this.stream = stream;
      this.audioElement = document.createElement("audio");
      this.audioElement.autoplay = false;
      this.audioElement.srcObject = stream;

      this.audioContext = new AudioContext({
         sinkId: storageStore.getState().getCachedValue("settings").outputDeviceId,
      });
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

   public setGain(globalGainPercent: number | undefined, localGainPercent: number | undefined) {
      if (globalGainPercent !== undefined) {
         this.globalGain = (globalGainPercent / 100) ** 2.3219;
      }
      if (localGainPercent !== undefined) {
         this.localGain = (localGainPercent / 100) ** 2.3219;
      }

      // if (this.localGain === undefined) {
      //    this.localGain = 1;
      // }

      // if (this.globalGain === undefined) {
      //    this.globalGain = 1;
      //

      this.gainNode.gain.value = this.globalGain * this.localGain;
   }

   public setSinkId(deviceId: string) {
      this.audioContext.setSinkId(deviceId);
      if (this.audioContext.state === "suspended") {
         this.audioContext.resume();
      }
   }
}
