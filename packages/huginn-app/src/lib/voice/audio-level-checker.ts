import { EventEmitterWithHistory } from "@huginn/api/src/event-emitter";

export class AudioLevelChecker extends EventEmitterWithHistory {
   private audioContext: AudioContext | undefined;
   private volumeNode: AudioWorkletNode | undefined;
   private isStopped = false;

   public async startChecking(stream: MediaStream) {
      this.stopChecking();
      this.isStopped = false;

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
         this.emit("audio-level", event.data.db);
      };
   }

   public stopChecking() {
      this.isStopped = true;
      this.volumeNode?.disconnect();
      this.audioContext?.close();
      this.volumeNode = undefined;
      this.audioContext = undefined;
   }
}
