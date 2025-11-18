import { EventEmitter } from "@huginn/api/src/event-emitter";
import { log, type HMediaKind } from "@huginn/shared";

export class AudioLevelChecker extends EventEmitter<{ "audio-level": number }> {
   private volumeNode: AudioWorkletNode | undefined;
   public audioContext: AudioContext | undefined;
   public stream?: MediaStream;
   public readonly consumerId: string;
   public readonly userId: string;
   public readonly kind: HMediaKind;
   public isStopped = false;
   public currentDb = 0;

   public constructor(consumerId: string, userId: string, kind: HMediaKind) {
      super();
      this.consumerId = consumerId;
      this.userId = userId;
      this.kind = kind;
   }

   public async startChecking(stream: MediaStream) {
      this.stopChecking();
      this.isStopped = false;

      log("app:audio-level-checker", "default", "start checking");

      this.stream = stream;
      this.audioContext = new AudioContext();
      await this.audioContext.audioWorklet.addModule(new URL("volume-processor.js", import.meta.url));

      if (this.isStopped) {
         this.stopChecking();
         return;
      }

      const source = this.audioContext.createMediaStreamSource(stream);
      this.volumeNode = new AudioWorkletNode(this.audioContext, "volume-processor");

      source.connect(this.volumeNode).connect(this.audioContext.destination);

      this.volumeNode.port.onmessage = (event: MessageEvent<{ db: number }>) => {
         if (!this.isStopped) {
            this.currentDb = event.data.db;
            this.emit("audio-level", event.data.db);
         }
      };
   }

   public stopChecking() {
      log("app:audio-level-checker", "default", "stop checking");

      this.isStopped = true;
      this.volumeNode?.disconnect();
      this.audioContext?.close();

      this.volumeNode = undefined;
      this.audioContext = undefined;
   }
}
