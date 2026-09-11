const WAVEFORM_SAMPLE_INTERVAL_SECONDS = 0.1;
const MAX_WAVEFORM_SAMPLES = 256;

export function encodeAudioWaveform(channels: Float32Array[], sampleRate: number) {
   const frameCount = channels[0]?.length ?? 0;
   if (frameCount === 0 || channels.length === 0 || sampleRate <= 0) return "";

   const sampleCount = Math.min(MAX_WAVEFORM_SAMPLES, Math.max(1, Math.ceil(frameCount / sampleRate / WAVEFORM_SAMPLE_INTERVAL_SECONDS)));
   const amplitudes = new Float32Array(sampleCount);
   let maximumAmplitude = 0;

   for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
      const startFrame = Math.floor((sampleIndex * frameCount) / sampleCount);
      const endFrame = Math.max(startFrame + 1, Math.floor(((sampleIndex + 1) * frameCount) / sampleCount));
      let sumOfSquares = 0;
      let valueCount = 0;

      for (const channel of channels) {
         const channelEndFrame = Math.min(endFrame, channel.length);
         for (let frameIndex = startFrame; frameIndex < channelEndFrame; frameIndex++) {
            sumOfSquares += channel[frameIndex] ** 2;
            valueCount++;
         }
      }

      const amplitude = valueCount > 0 ? Math.sqrt(sumOfSquares / valueCount) : 0;
      amplitudes[sampleIndex] = amplitude;
      maximumAmplitude = Math.max(maximumAmplitude, amplitude);
   }

   const waveform = Uint8Array.from(amplitudes, (amplitude) => (maximumAmplitude > 0 ? Math.round((amplitude / maximumAmplitude) * 255) : 0));

   return btoa(String.fromCharCode(...waveform));
}

export function decodeAudioWaveform(waveform: string) {
   try {
      const decoded = atob(waveform);
      if (decoded.length === 0 || decoded.length > MAX_WAVEFORM_SAMPLES) return undefined;

      return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
   } catch {
      return undefined;
   }
}

export async function createAudioWaveform(blob: Blob) {
   const context = new AudioContext();

   try {
      const buffer = await context.decodeAudioData(await blob.arrayBuffer());
      const channels = Array.from({ length: buffer.numberOfChannels }, (_, channelIndex) => buffer.getChannelData(channelIndex));
      return encodeAudioWaveform(channels, buffer.sampleRate);
   } finally {
      await context.close();
   }
}
