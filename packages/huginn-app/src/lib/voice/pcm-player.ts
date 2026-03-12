export class PCMPlayer {
   private sampleRate: number;
   private numChannels: number;
   private audioContext: AudioContext;
   private playTime: number;
   private bufferHeadroom = 0.05;
   private lastChunkTime: number;
   private silenceThresholdMs = 200;

   constructor(sampleRate: number, numChannels: number) {
      this.sampleRate = sampleRate;
      this.numChannels = numChannels;
      this.audioContext = new AudioContext();
      this.playTime = this.audioContext.currentTime;
      this.lastChunkTime = performance.now();
   }

   private convertPCM(data: Uint8Array) {
      const bytesPerSample = 2;
      const totalSamples = data.length / bytesPerSample;
      const float32 = new Float32Array(totalSamples);
      const view = new DataView(data.buffer);

      for (let i = 0; i < totalSamples; i++) {
         const int16 = view.getInt16(i * bytesPerSample, true);
         float32[i] = int16 / 32768;
      }

      return float32;
   }

   public playChunk(data: Uint8Array) {
      const now = performance.now();
      const timeSinceLast = now - this.lastChunkTime;
      this.lastChunkTime = now;

      // If too much silence, reset playTime
      if (timeSinceLast > this.silenceThresholdMs) {
         this.playTime = this.audioContext.currentTime + this.bufferHeadroom;
      }

      const floatData = this.convertPCM(data);
      const frameCount = floatData.length / this.numChannels;
      const buffer = this.audioContext.createBuffer(this.numChannels, frameCount, this.sampleRate);

      for (let ch = 0; ch < this.numChannels; ch++) {
         const channelData = buffer.getChannelData(ch);
         for (let i = 0; i < frameCount; i++) {
            channelData[i] = floatData[i * this.numChannels + ch];
         }
      }

      const source = this.audioContext.createBufferSource();
      const gain = this.audioContext.createGain();
      source.buffer = buffer;

      gain.gain.value = 2;
      source.connect(gain).connect(this.audioContext.destination);

      // Schedule playback
      this.playTime = Math.max(this.playTime, this.audioContext.currentTime + this.bufferHeadroom);
      source.start(this.playTime);

      this.playTime += buffer.duration;
   }
}
