class VolumeProcessor extends AudioWorkletProcessor {
   process(inputs) {
      const input = inputs[0][0];
      if (!input) return true;

      let sum = 0;
      for (let i = 0; i < input.length; i++) {
         sum += input[i] * input[i];
      }

      const rms = Math.sqrt(sum / input.length);
      const db = 20 * Math.log10(rms || 1e-8);

      this.port.postMessage(db);
      return true;
   }
}

registerProcessor("volume-processor", VolumeProcessor);
