import { type HMediaKind, log, type Snowflake } from "@huginn/shared";
import { settingsStore } from "@stores/settingsStore";

export class AudioSourcePlayer {
   private gainNode: GainNode;
   private audioContext: AudioContext;
   private audioElement: HTMLAudioElement;
   private abortController: AbortController;
   public producerId: string;
   public userId: Snowflake;
   public kind: HMediaKind;

   private globalGain?: number;
   private localGain?: number;

   public constructor(srcObject: MediaProvider, producerId: string, userId: Snowflake, kind: HMediaKind, globalGainPercent: number) {
      log("app:audio-source-player", "default", "initializing", "pid:", producerId, "uid:", userId, "mk:", kind, "ggp:", globalGainPercent)

      this.producerId = producerId;
      this.userId = userId;
      this.kind = kind;
      this.abortController = new AbortController();

      this.audioElement = document.createElement("audio");
      this.audioElement.autoplay = false;
      this.audioElement.srcObject = srcObject;

      this.audioContext = new AudioContext({ sinkId: settingsStore.getState().local.outputDeviceId });
      this.gainNode = this.audioContext.createGain();

      this.setGain(globalGainPercent, undefined);

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
      log("app:audio-source-player", "default", "stop")

      this.abortController.abort();
      this.gainNode.disconnect();
      this.audioContext.close();
      this.audioElement.pause();
      this.audioElement.srcObject = null;
   }

   public setGain(globalGainPercent: number | undefined, localGainPercent: number | undefined) {
      log("app:audio-source-player", "default", "set gain", "gg:", globalGainPercent, "lg:", localGainPercent)

      if (globalGainPercent) {
         this.globalGain = (globalGainPercent / 100) ** 2.3219;
      }
      if (localGainPercent !== undefined) {
         this.localGain = (localGainPercent / 100) ** 2.3219;
      }

      if (this.localGain === undefined) {
         this.localGain = 1;
      }

      if (this.globalGain === undefined) {
         this.globalGain = 1;
      }

      this.gainNode.gain.value = (this.globalGain) * (this.localGain);
   }

   public setSinkId(deviceId: string) {
      log("app:audio-source-player", "default", "set sink id", "did:", deviceId)

      this.audioContext.setSinkId(deviceId);
   }
}
