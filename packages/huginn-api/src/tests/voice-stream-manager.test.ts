import { CONSTANTS } from "@huginnjs/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { audioTrack, createVoiceSession, installVoiceEnvironment, videoTrack } from "./voice-test-utils";

let session: ReturnType<typeof createVoiceSession>;
beforeEach(async () => {
   installVoiceEnvironment();
   session = createVoiceSession();
   await session.manager.connectVoice(null, "channel");
});
afterEach(() => {
   session.voice.signaling.close();
   vi.unstubAllGlobals();
});

describe("screen and audio streams", () => {
   it("publishes screen video and audio, replaces both tracks, and stops sharing", async () => {
      const { voice, manager } = session;
      await voice.stream.openStream(videoTrack(), audioTrack());
      const video = voice.transport.getProducer("stream_video")!;
      const audio = voice.transport.getProducer("stream_audio")!;
      expect(manager.voiceState.gatewayVoiceState.isScreenSharing).toBe(true);
      const replacementVideo = videoTrack();
      const replacementAudio = audioTrack();

      await voice.stream.replaceStreamVideoTrack(replacementVideo);
      await voice.stream.replaceStreamAudioTrack(replacementAudio);
      expect(video.track).toBe(replacementVideo);
      expect(audio.track).toBe(replacementAudio);

      await voice.stream.closeStream();
      expect(video.closed).toBe(true);
      expect(audio.closed).toBe(true);
      expect(manager.voiceState.gatewayVoiceState.isScreenSharing).toBe(false);
   });

   it("can share and close application audio without a video track", async () => {
      const { voice, manager } = session;
      const track = audioTrack();

      await voice.stream.openStream(undefined, track);

      expect(voice.transport.getProducer("stream_audio")?.track).toBe(track);
      expect(voice.transport.getProducer("stream_video")).toBeUndefined();
      expect(manager.voiceState.gatewayVoiceState).toMatchObject({ isAudioStreaming: true, isScreenSharing: false });
      await voice.stream.closeStream();
      expect(voice.transport.getProducers()).toEqual([]);
      expect(manager.voiceState.gatewayVoiceState.isAudioStreaming).toBe(false);
   });

   it("updates video quality while preserving unspecified dimensions and the active track", async () => {
      const { voice } = session;
      const track = videoTrack({ width: 1920, height: 1080, frameRate: 30 });
      await voice.stream.openStream(track);
      const updated = vi.fn();
      voice.stream.on("video_constraints_updated", updated);

      await voice.stream.updateVideoParameters({ frameRate: 60, maxBitrate: 2_000_000 });

      expect(track.getSettings()).toMatchObject({ width: 1920, height: 1080, frameRate: 60 });
      expect(updated).toHaveBeenCalledWith({ width: 1920, height: 1080, frameRate: 60 });
      const video = voice.transport.getProducer("stream_video")!;
      expect(video.track).toBe(track);
      expect(video.rtpSender?.getParameters().encodings.at(-1)?.maxBitrate).toBe(2_000_000);
   });

   it.each([true, false])("caps video bitrate for simulcast enabled: %s", async (useSimulcast) => {
      const { voice } = session;
      await voice.stream.openStream(videoTrack(), undefined, { useSimulcast });
      const video = voice.transport.getProducer("stream_video")!;

      await voice.stream.updateVideoBitrate(Number.MAX_SAFE_INTEGER);

      const encodings = video.rtpSender!.getParameters().encodings;
      expect(encodings).toHaveLength(useSimulcast ? 2 : 1);
      expect(encodings.at(-1)?.maxBitrate).toBe(CONSTANTS.MAX_VIDEO_BITRATE);
      expect(encodings.every((encoding) => encoding.maxBitrate! <= CONSTANTS.MAX_VIDEO_BITRATE)).toBe(true);
   });

   it("clamps audio bitrate to the supported range", async () => {
      const { voice } = session;
      await voice.stream.openStream(undefined, audioTrack(), { maxAudioBitrate: 128000 });
      const audio = voice.transport.getProducer("stream_audio")!;
      expect(audio.rtpSender!.getParameters().encodings[0].maxBitrate).toBe(128000);

      await voice.stream.updateAudioBitrate(1);
      expect(audio.rtpSender!.getParameters().encodings[0].maxBitrate).toBe(CONSTANTS.MIN_AUDIO_BITRATE);
      await voice.stream.updateAudioBitrate(Number.MAX_SAFE_INTEGER);
      expect(audio.rtpSender!.getParameters().encodings[0].maxBitrate).toBe(CONSTANTS.MAX_AUDIO_BITRATE);
   });

   it("reports that quality cannot be changed without an active stream", async () => {
      await expect(session.voice.stream.updateVideoParameters({ width: 1280 })).rejects.toThrow(/No video producer/);
      await expect(session.voice.stream.updateAudioBitrate(64000)).rejects.toThrow(/No audio producer/);
   });
});
