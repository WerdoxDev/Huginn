export class VoiceInputDevice {
   private currentStream?: MediaStream;
   private gainNode?: GainNode;
   private audioContext?: AudioContext;
   private destination?: MediaStreamAudioDestinationNode
   private source?: MediaStreamAudioSourceNode

   public async getStream(deviceId: string, volumePercentage: number, noiseSuppression: boolean) {
      const audioConstraints: MediaTrackConstraints = {
         deviceId: deviceId,
         sampleRate: 48000,
         channelCount: 2,
         echoCancellation: noiseSuppression,
         noiseSuppression: noiseSuppression,
         autoGainControl: false,
      }

      let newConstraints: MediaTrackConstraints | undefined;

      if (this.currentStream) {
         this.gainNode?.disconnect();
         this.destination?.disconnect();
         this.source?.disconnect();
         this.audioContext?.close();

         const track = this.currentStream.getAudioTracks()[0];
         track.stop();

         newConstraints = Object.assign(track.getSettings(), { echoCancellation: noiseSuppression, noiseSuppression: noiseSuppression } as MediaTrackConstraints,);
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
         audio: newConstraints ?? audioConstraints,
      });

      this.currentStream = newStream;

      this.audioContext = new AudioContext();
      this.source = this.audioContext.createMediaStreamSource(this.currentStream);

      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = volumePercentage / 100;

      this.source.connect(this.gainNode);

      this.destination = this.audioContext.createMediaStreamDestination();
      this.gainNode.connect(this.destination);

      return this.destination.stream;
   }

   public setGain(volumePercentage: number) {
      if (this.gainNode) {
         this.gainNode.gain.value = volumePercentage / 100;
      }
   }
}
