import { log, type HMediaKind } from "@huginnjs/shared";

export class AudioLevelChecker {
   private volumeNode: AudioWorkletNode | undefined;
   public audioContext: AudioContext | undefined;
   public stream?: MediaStream;
   public readonly producerId?: string;
   public readonly consumerId?: string;
   public readonly userId?: string;
   public readonly kind?: HMediaKind;
   public isStopped = true;
   public currentDb = 0;
   public onAudioLevel?: (db: number) => void;

   private messageHandler?: (event: MessageEvent<number>) => void;

   public constructor(producerId?: string, consumerId?: string, userId?: string, kind?: HMediaKind) {
      this.producerId = producerId;
      this.consumerId = consumerId;
      this.userId = userId;
      this.kind = kind;
   }

   public async startChecking(stream: MediaStream) {
      // this.stopChecking();
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

      this.messageHandler = (event: MessageEvent<number>) => {
         if (this.isStopped) return;

         this.currentDb = event.data;
         this.onAudioLevel?.(event.data);
      };

      this.volumeNode.port.onmessage = this.messageHandler;
   }

   public stopChecking() {
      log("app:audio-level-checker", "default", "stop checking");
      this.isStopped = true;

      if (this.volumeNode?.port && this.messageHandler) {
         this.volumeNode.port.onmessage = null;
      }

      this.onAudioLevel = undefined;
      this.messageHandler = undefined;

      this.volumeNode?.port.close();
      this.volumeNode?.disconnect();
      this.audioContext?.close();

      this.volumeNode = undefined;
      this.audioContext = undefined;
      this.stream = undefined;
   }
}
