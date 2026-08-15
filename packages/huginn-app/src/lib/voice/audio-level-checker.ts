import { type HMediaKind } from "@huginnjs/shared";

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
   private generation = 0;

   public constructor(producerId?: string, consumerId?: string, userId?: string, kind?: HMediaKind) {
      this.producerId = producerId;
      this.consumerId = consumerId;
      this.userId = userId;
      this.kind = kind;
   }

   public async startChecking(stream: MediaStream) {
      this.teardown(false);

      const generation = ++this.generation;
      this.isStopped = false;

      this.stream = stream;
      const audioContext = new AudioContext();
      this.audioContext = audioContext;

      try {
         await audioContext.audioWorklet.addModule(new URL("volume-processor.js", import.meta.url));
      } catch (error) {
         // Closing an AudioContext while its worklet is loading rejects addModule with
         // AbortError. The stop/restart that invalidated this generation already owns
         // cleanup, so there is nothing left for this start operation to report.
         if (generation !== this.generation || this.isStopped) return;

         this.stopChecking();
         throw error;
      }

      if (generation !== this.generation || this.isStopped) return;

      const source = audioContext.createMediaStreamSource(stream);
      this.volumeNode = new AudioWorkletNode(audioContext, "volume-processor");
      source.connect(this.volumeNode).connect(audioContext.destination);

      this.messageHandler = (event: MessageEvent<number>) => {
         if (this.isStopped) return;

         this.currentDb = event.data;
         this.onAudioLevel?.(event.data);
      };

      this.volumeNode.port.onmessage = this.messageHandler;
   }

   public stopChecking() {
      this.teardown(true);
   }

   private teardown(clearListener: boolean) {
      this.generation += 1;
      this.isStopped = true;

      if (this.volumeNode?.port && this.messageHandler) {
         this.volumeNode.port.onmessage = null;
      }

      if (clearListener) this.onAudioLevel = undefined;
      this.messageHandler = undefined;

      this.volumeNode?.port.close();
      this.volumeNode?.disconnect();
      this.audioContext?.close();

      this.volumeNode = undefined;
      this.audioContext = undefined;
      this.stream = undefined;
   }
}
