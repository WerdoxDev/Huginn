import { CONSTANTS, type MediasoupAppData } from "@huginn/shared";
import { FakeMediaStreamTrack } from "fake-mediastreamtrack";
import { testFakeParameters } from "mediasoup-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VoiceStreamManager } from "../voice-stream-manager";
import { VoiceTransportManager } from "./voice-mocks";

// This is not using FakeMediaStreamTrack because we need to be able to apply constraints and get settings, which FakeMediaStreamTrack does not support.
function makeVideoTrack(initialSettings: { width?: number; height?: number; frameRate?: number } = {}) {
   const settings = {
      width: initialSettings.width,
      height: initialSettings.height,
      frameRate: initialSettings.frameRate,
   };

   return {
      id: "video-track",
      kind: "video",
      addEventListener: vi.fn(),
      getSettings: () => ({ ...settings }),
      applyConstraints: vi.fn(async (constraints: MediaTrackConstraints) => {
         if (constraints.width !== undefined) settings.width = constraints.width as number;
         if (constraints.height !== undefined) settings.height = constraints.height as number;
         if (constraints.frameRate !== undefined) settings.frameRate = constraints.frameRate as number;
      }),
   } as unknown as MediaStreamTrack;
}

function makeAudioTrack(): MediaStreamTrack {
   return new FakeMediaStreamTrack({ kind: "audio" });
}

async function makeProducer(track?: MediaStreamTrack, params?: { encodings: Array<{ maxBitrate?: number }> }) {
   const finalTrack = track ?? new FakeMediaStreamTrack({ kind: "video" });
   const producer = await transport.sendTransport?.produce<MediasoupAppData>({ track: finalTrack });

   const parameters = params ?? { encodings: [{ maxBitrate: 1000 }, { maxBitrate: 3000 }] };
   const rtpSender = {
      getParameters: vi.fn(() => parameters),
      setParameters: vi.fn(async (nextParams: { encodings: Array<{ maxBitrate?: number }> }) => {
         parameters.encodings = nextParams.encodings;
      }),
   };

   (producer!["_rtpSender"] as any) = rtpSender as unknown as RTCRtpSender;

   if (!track) {
      await producer?.replaceTrack({ track: null });
   }

   return producer!;
}

let transport: VoiceTransportManager;
let streamManager: VoiceStreamManager;

beforeEach(async () => {
   vi.restoreAllMocks();
   transport = new VoiceTransportManager();
   streamManager = new VoiceStreamManager(transport as any);
   await transport.initializeDevice(testFakeParameters.generateRouterRtpCapabilities());
});

describe("VoiceStreamManager", () => {
   it("opens a stream with simulcast enabled by default", async () => {
      const videoTrack = makeVideoTrack();
      const audioTrack = makeAudioTrack();

      await streamManager.openStream(videoTrack, audioTrack, { maxVideoBitrate: 6000, maxAudioBitrate: 128000 });

      expect(transport.createProducer).toHaveBeenCalledTimes(2);
      expect(transport.createProducer).toHaveBeenNthCalledWith(
         1,
         "stream_video",
         videoTrack,
         expect.objectContaining({
            codecOptions: { videoGoogleStartBitrate: 1000 },
            encodings: [
               expect.objectContaining({ scaleResolutionDownBy: 3, maxBitrate: 133333.33333333334, scalabilityMode: "L1T3" }),
               expect.objectContaining({ scaleResolutionDownBy: 1, maxBitrate: 400000, scalabilityMode: "L1T3" }),
            ],
         }),
      );
      expect(transport.createProducer).toHaveBeenNthCalledWith(
         2,
         "stream_audio",
         audioTrack,
         expect.objectContaining({ codecOptions: { opusStereo: true }, encodings: [{ maxBitrate: 128000 }] }),
      );
   });

   it("opens a stream without simulcast when requested", async () => {
      const videoTrack = makeVideoTrack();

      await streamManager.openStream(videoTrack, undefined, { useSimulcast: false });

      expect(transport.createProducer).toHaveBeenCalledTimes(1);
      expect(transport.createProducer).toHaveBeenCalledWith(
         "stream_video",
         videoTrack,
         expect.objectContaining({
            encodings: [expect.objectContaining({ scaleResolutionDownBy: 1, scalabilityMode: "L1T3" })],
         }),
      );
   });

   it("opens an audio only stream when requested", async () => {
      const audioTrack = makeAudioTrack();

      await streamManager.openStream(undefined, audioTrack, { useSimulcast: false });

      expect(transport.createProducer).toHaveBeenCalledTimes(1);
      expect(transport.createProducer).toHaveBeenCalledWith(
         "stream_audio",
         audioTrack,
         expect.objectContaining({
            encodings: [expect.objectContaining({ maxBitrate: 100000 })],
         }),
      );
   });

   it("updates video constraints and emits the resolved dimensions", async () => {
      const videoTrack = makeVideoTrack({ width: 1920, height: 1080, frameRate: 60 });
      const applyConstraints = vi.spyOn(videoTrack, "applyConstraints");

      const producer = await makeProducer(videoTrack);
      // producer["_track"] = videoTrack;
      transport.producers.set("stream_video", producer);

      const updated = vi.fn();
      streamManager.on("video_constraints_updated", updated);

      await streamManager.updateVideoConstraints(1280, 720, 30);

      expect(applyConstraints).toHaveBeenCalledWith({ width: 1280, height: 720, frameRate: 30 });
      expect(updated).toHaveBeenCalledWith({ width: 1280, height: 720, frameRate: 30 });
   });

   it("throws when updating video constraints without a video producer or track", async () => {
      await expect(streamManager.updateVideoConstraints(1280, 720, 30)).rejects.toThrow("No video producer found");

      transport.producers.set("stream_video", await makeProducer(undefined));
      await expect(streamManager.updateVideoConstraints(1280, 720, 30)).rejects.toThrow("No video track found on producer");
   });

   it("updates video bitrate for simulcast and emits the clamped bitrate", async () => {
      const producer = await makeProducer(undefined, { encodings: [{ maxBitrate: 1000 }, { maxBitrate: 3000 }] });
      transport.producers.set("stream_video", producer);
      const updated = vi.fn();
      streamManager.on("video_bitrate_updated", updated);

      await streamManager.updateVideoBitrate(9000000);

      expect(producer.rtpSender?.getParameters).toHaveBeenCalledTimes(1);
      expect(producer.rtpSender?.setParameters).toHaveBeenCalledWith({
         encodings: [{ maxBitrate: 1333333.3333333333 }, { maxBitrate: CONSTANTS.MAX_VIDEO_BITRATE }],
      });
      expect(updated).toHaveBeenCalledWith({ maxBitrate: CONSTANTS.MAX_VIDEO_BITRATE });
   });

   it("updates video bitrate for non-simulcast and emits the clamped bitrate", async () => {
      const producer = await makeProducer(undefined, { encodings: [{ maxBitrate: 1000 }] });
      transport.producers.set("stream_video", producer);
      const updated = vi.fn();
      streamManager.on("video_bitrate_updated", updated);

      await streamManager.updateVideoBitrate(9000000);

      expect(producer.rtpSender?.getParameters).toHaveBeenCalledTimes(1);
      expect(producer.rtpSender?.setParameters).toHaveBeenCalledWith({ encodings: [{ maxBitrate: CONSTANTS.MAX_VIDEO_BITRATE }] });
      expect(updated).toHaveBeenCalledWith({ maxBitrate: CONSTANTS.MAX_VIDEO_BITRATE });
   });

   it("updates audio bitrate and emits the clamped bitrate", async () => {
      const producer = await makeProducer(undefined, { encodings: [{ maxBitrate: 64000 }] });
      transport.producers.set("stream_audio", producer);
      const updated = vi.fn();
      streamManager.on("audio_bitrate_updated", updated);

      await streamManager.updateAudioBitrate(500);

      expect(producer.rtpSender?.setParameters).toHaveBeenCalledWith({ encodings: [{ maxBitrate: 10000 }] });
      expect(updated).toHaveBeenCalledWith({ maxBitrate: 10000 });
   });

   it("delegates combined video parameter updates to the underlying methods", async () => {
      const updateVideoConstraintsSpy = vi.spyOn(streamManager, "updateVideoConstraints").mockResolvedValue(undefined);
      const updateVideoBitrateSpy = vi.spyOn(streamManager, "updateVideoBitrate").mockResolvedValue(undefined);

      await streamManager.updateVideoParameters({ width: 640, height: 360, frameRate: 24, maxBitrate: 2000000 });

      expect(updateVideoConstraintsSpy).toHaveBeenCalledWith(640, 360, 24);
      expect(updateVideoBitrateSpy).toHaveBeenCalledWith(2000000);
   });

   it("does noting when updateVideoParameters() is called with no parameters", async () => {
      const updateVideoConstraintsSpy = vi.spyOn(streamManager, "updateVideoConstraints").mockResolvedValue(undefined);
      const updateVideoBitrateSpy = vi.spyOn(streamManager, "updateVideoBitrate").mockResolvedValue(undefined);

      await streamManager.updateVideoParameters({});

      expect(updateVideoConstraintsSpy).not.toHaveBeenCalled();
      expect(updateVideoBitrateSpy).not.toHaveBeenCalled();
   });

   it("replaces stream tracks and closes stream producers", async () => {
      const videoTrack = makeVideoTrack();
      const audioTrack = makeAudioTrack();

      await streamManager.replaceStreamVideoTrack(videoTrack);
      await streamManager.replaceStreamAudioTrack(audioTrack);
      await streamManager.closeStreamAudio();
      await streamManager.closeStreamVideo();

      expect(transport.replaceProducerTrack).toHaveBeenCalledWith("stream_video", videoTrack);
      expect(transport.replaceProducerTrack).toHaveBeenCalledWith("stream_audio", audioTrack);
      expect(transport.closeProducer).toHaveBeenNthCalledWith(1, "stream_audio");
      expect(transport.closeProducer).toHaveBeenNthCalledWith(2, "stream_video");
   });

   it("closes only the producers that exist when closing the whole stream", async () => {
      transport.producers.set("stream_audio", await makeProducer());

      await streamManager.closeStream();

      transport.producers.set("stream_video", await makeProducer());

      await streamManager.closeStream();

      transport.producers.set("stream_video", await makeProducer());
      transport.producers.set("stream_audio", await makeProducer());

      await streamManager.closeStream();

      expect(transport.closeProducer).toHaveBeenCalledTimes(4);
      expect(transport.closeProducer).toHaveBeenCalledWith("stream_audio");
      expect(transport.closeProducer).toHaveBeenCalledWith("stream_video");
   });

   it("throws when bitrate updates are requested without a matching producer", async () => {
      await expect(streamManager.updateVideoBitrate(4000000)).rejects.toThrow("No video producer found");
      await expect(streamManager.updateAudioBitrate(64000)).rejects.toThrow("No audio producer found");
   });

   it("throws when producer doesn't have an rtpSender when updating bitrate", async () => {
      const videoProducer = await makeProducer();
      (videoProducer as any)["_rtpSender"] = undefined;
      transport.producers.set("stream_video", videoProducer);
      await expect(streamManager.updateVideoBitrate(4000000)).rejects.toThrow("Failed to get RTP parameters");

      const audioProducer = await makeProducer();
      (audioProducer as any)["_rtpSender"] = undefined;
      transport.producers.set("stream_audio", audioProducer);
      await expect(streamManager.updateAudioBitrate(64000)).rejects.toThrow("Failed to get RTP parameters");
   });

   it("does nothing when updateVideoConstraints() is called with no parameters", async () => {
      const videoTrack = makeVideoTrack({ width: 1920, height: 1080, frameRate: 60 });
      const applyConstraints = vi.spyOn(videoTrack, "applyConstraints");

      const producer = await makeProducer(videoTrack);
      transport.producers.set("stream_video", producer);

      await streamManager.updateVideoConstraints();
      expect(applyConstraints).toHaveBeenCalledWith({ width: 1920, height: 1080, frameRate: 60 });
   });
});
