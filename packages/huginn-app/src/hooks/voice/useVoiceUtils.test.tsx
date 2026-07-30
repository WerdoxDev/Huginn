import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => {
   return {
      isFullscreen: false,
      toggleFullscreen: vi.fn(),
      error: vi.fn(),
      getMediaErrorMessage: vi.fn(() => "media error message"),
      updateModals: vi.fn(),
      environment: "browser" as "browser" | "desktop",
      settings: { cameraDeviceId: "default-camera" } as Record<string, unknown>,
      // Reassigned in beforeEach to a fresh mock client per test.
      client: undefined as unknown,
   };
});

vi.mock("@hooks/useFullscreen", () => ({
   useFullscreen: () => ({
      isFullscreen: mocks.isFullscreen,
      toggleFullscreen: mocks.toggleFullscreen,
   }),
}));

vi.mock("@lib/utils", () => ({
   getMediaErrorMessage: (...args: unknown[]) => mocks.getMediaErrorMessage(...(args as [])),
}));

vi.mock("@stores/clientStore", () => ({
   useClient: () => mocks.client,
}));

vi.mock("@stores/modalsStore", () => ({
   useModals: () => ({ updateModals: mocks.updateModals }),
}));

vi.mock("@stores/storageStore", () => ({
   useStorage: () => mocks.settings,
}));

vi.mock("@stores/userStore", () => ({
   useThisUser: () => ({ user: { id: "user-1" } }),
}));

vi.mock("@stores/windowStore", () => ({
   useHuginnWindow: () => ({ environment: mocks.environment }),
}));

import { useVoiceUtils } from "./useVoiceUtils";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockTrack(kind: "audio" | "video") {
   return { kind, id: `${kind}-track`, stop: vi.fn() } as unknown as MediaStreamTrack;
}

function createMockMediaStream(withAudio = true, withVideo = true) {
   const audioTrack = withAudio ? createMockTrack("audio") : undefined;
   const videoTrack = withVideo ? createMockTrack("video") : undefined;
   return {
      getAudioTracks: () => (audioTrack ? [audioTrack] : []),
      getVideoTracks: () => (videoTrack ? [videoTrack] : []),
   } as unknown as MediaStream;
}

function createMockClient() {
   return {
      voiceManager: {
         voiceState: {
            gatewayVoiceState: { isAudioMuted: false, isAudioDeafened: false } as { isAudioMuted?: boolean; isAudioDeafened?: boolean } | undefined,
            updateGatewayVoiceState: vi.fn().mockResolvedValue(undefined),
         },
         connectVoice: vi.fn().mockResolvedValue(undefined),
      },
      voice: {
         status: "ready" as "ready" | "disconnected" | "connecting",
         stopAudioLoopback: vi.fn().mockResolvedValue(undefined),
         startAudioLoopback: vi.fn().mockResolvedValue(createMockTrack("audio")),
         transport: {
            getProducer: vi.fn().mockReturnValue(undefined),
            getRemoteProducers: vi.fn().mockReturnValue([]),
            createConsumer: vi.fn().mockResolvedValue(undefined),
            getConsumer: vi.fn().mockReturnValue(undefined),
            closeConsumer: vi.fn().mockResolvedValue(undefined),
         },
         stream: {
            openStream: vi.fn().mockResolvedValue(undefined),
            replaceStreamVideoTrack: vi.fn().mockResolvedValue(undefined),
            replaceStreamAudioTrack: vi.fn().mockResolvedValue(undefined),
            updateVideoBitrate: vi.fn().mockResolvedValue(undefined),
            updateAudioBitrate: vi.fn().mockResolvedValue(undefined),
            closeStreamAudio: vi.fn().mockResolvedValue(undefined),
            closeStream: vi.fn().mockResolvedValue(undefined),
            updateVideoParameters: vi.fn().mockResolvedValue(undefined),
         },
         device: {
            openCamera: vi.fn().mockResolvedValue(undefined),
            replaceCameraTrack: vi.fn().mockResolvedValue(undefined),
            closeCamera: vi.fn().mockResolvedValue(undefined),
         },
      },
   };
}

let mockClient: ReturnType<typeof createMockClient>;

beforeEach(() => {
   vi.clearAllMocks();

   mocks.isFullscreen = false;
   mocks.environment = "browser";
   mocks.settings = { cameraDeviceId: "default-camera" };

   mockClient = createMockClient();
   mocks.client = mockClient;

   Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
         getDisplayMedia: vi.fn().mockResolvedValue(createMockMediaStream()),
         getUserMedia: vi.fn().mockResolvedValue(createMockMediaStream(false, true)),
      },
      writable: true,
      configurable: true,
   });
});

// ---------------------------------------------------------------------------
// toggleMute
// ---------------------------------------------------------------------------

describe("toggleMute", () => {
   it("mutes when currently unmuted", async () => {
      mockClient.voiceManager.voiceState.gatewayVoiceState = { isAudioMuted: false };
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.toggleMute();
      });

      expect(mockClient.voiceManager.voiceState.updateGatewayVoiceState).toHaveBeenCalledWith({
         isAudioMuted: true,
      });
   });

   it("unmutes when currently muted", async () => {
      mockClient.voiceManager.voiceState.gatewayVoiceState = { isAudioMuted: true };
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.toggleMute();
      });

      expect(mockClient.voiceManager.voiceState.updateGatewayVoiceState).toHaveBeenCalledWith({
         isAudioMuted: false,
      });
   });

   it("defaults to muting when gatewayVoiceState is undefined", async () => {
      mockClient.voiceManager.voiceState.gatewayVoiceState = undefined;
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.toggleMute();
      });

      expect(mockClient.voiceManager.voiceState.updateGatewayVoiceState).toHaveBeenCalledWith({
         isAudioMuted: true,
      });
   });
});

// ---------------------------------------------------------------------------
// toggleDeafen
// ---------------------------------------------------------------------------

describe("toggleDeafen", () => {
   it("deafens and mutes when currently not deafened", async () => {
      mockClient.voiceManager.voiceState.gatewayVoiceState = { isAudioDeafened: false };
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.toggleDeafen();
      });

      expect(mockClient.voiceManager.voiceState.updateGatewayVoiceState).toHaveBeenCalledWith({
         isAudioDeafened: true,
         isAudioMuted: true,
      });
   });

   it("undeafens and unmutes when currently deafened", async () => {
      mockClient.voiceManager.voiceState.gatewayVoiceState = { isAudioDeafened: true };
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.toggleDeafen();
      });

      expect(mockClient.voiceManager.voiceState.updateGatewayVoiceState).toHaveBeenCalledWith({
         isAudioDeafened: false,
         isAudioMuted: false,
      });
   });
});

// ---------------------------------------------------------------------------
// openScreenShare - browser environment (no modal, uses getDisplayMedia directly)
// ---------------------------------------------------------------------------

describe("openScreenShare (browser environment)", () => {
   beforeEach(() => {
      mocks.environment = "browser";
   });

   it("exits fullscreen before requesting display media", async () => {
      mocks.isFullscreen = true;
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.openScreenShare();
      });

      expect(mocks.toggleFullscreen).toHaveBeenCalled();
   });

   it("opens a new stream when no video producer exists yet", async () => {
      mockClient.voice.transport.getProducer.mockReturnValue(undefined);
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.openScreenShare();
      });

      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith({ audio: true, video: true });
      expect(mockClient.voice.stream.openStream).toHaveBeenCalled();
   });

   it("replaces the existing video and audio tracks when a video producer already exists", async () => {
      mockClient.voice.transport.getProducer.mockImplementation((kind: string) => {
         if (kind === "stream_video") return { id: "existing-video" };
         if (kind === "stream_audio") return { id: "existing-audio" };
         return undefined;
      });
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.openScreenShare();
      });

      expect(mockClient.voice.stream.replaceStreamVideoTrack).toHaveBeenCalled();
      expect(mockClient.voice.stream.replaceStreamAudioTrack).toHaveBeenCalled();
      expect(mockClient.voice.stream.openStream).not.toHaveBeenCalled();
   });

   it("closes the audio stream when a video producer exists but the new capture has no audio track", async () => {
      mockClient.voice.transport.getProducer.mockImplementation((kind: string) => {
         if (kind === "stream_video") return { id: "existing-video" };
         if (kind === "stream_audio") return { id: "existing-audio" };
         return undefined;
      });
      (navigator.mediaDevices.getDisplayMedia as ReturnType<typeof vi.fn>).mockResolvedValue(createMockMediaStream(false, true));
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.openScreenShare();
      });

      expect(mockClient.voice.stream.closeStreamAudio).toHaveBeenCalled();
   });

   it("shows an error modal and closes the stream if getDisplayMedia rejects", async () => {
      const displayMediaError = new Error("permission denied");
      (navigator.mediaDevices.getDisplayMedia as ReturnType<typeof vi.fn>).mockRejectedValue(displayMediaError);
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.openScreenShare();
      });

      expect(mocks.updateModals).toHaveBeenCalledWith(
         expect.objectContaining({
            info: expect.objectContaining({ status: "error", title: "Screen Sharing Failed" }),
         }),
      );
   });
});

// ---------------------------------------------------------------------------
// openScreenShare - desktop environment (goes through a modal + callback)
// ---------------------------------------------------------------------------

describe("openScreenShare (desktop environment)", () => {
   beforeEach(() => {
      mocks.environment = "desktop";
   });

   it("opens the screen share modal with type 'create' when no video producer exists", async () => {
      mockClient.voice.transport.getProducer.mockReturnValue(undefined);
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.openScreenShare();
      });

      expect(mocks.updateModals).toHaveBeenCalledWith(
         expect.objectContaining({
            screenShare: expect.objectContaining({ isOpen: true, type: "create" }),
         }),
      );
   });

   it("opens the screen share modal with type 'change' when a video producer already exists", async () => {
      mockClient.voice.transport.getProducer.mockImplementation((kind: string) => (kind === "stream_video" ? { id: "existing" } : undefined));
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.openScreenShare();
      });

      expect(mocks.updateModals).toHaveBeenCalledWith(
         expect.objectContaining({
            screenShare: expect.objectContaining({ type: "change" }),
         }),
      );
   });

   it("callback opens a new stream using the provided display stream", async () => {
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.openScreenShare();
      });

      const callback = mocks.updateModals.mock.calls[0][0].screenShare.callback;
      const stream = createMockMediaStream();

      await act(async () => {
         await callback({
            stream,
            type: "display",
            isAudioEnabled: false,
            isSimulcastEnabled: true,
            maxAudioBitrate: 64000,
            maxVideoBitrate: 2500000,
            sourceName: "Screen 1",
         });
      });

      expect(mockClient.voice.stopAudioLoopback).toHaveBeenCalled();
      expect(mockClient.voice.stream.openStream).toHaveBeenCalled();
   });

   it("callback updates an existing stream using the provided options", async () => {
      const { result } = renderHook(() => useVoiceUtils());
      mockClient.voice.transport.getProducer.mockImplementation((kind: string) =>
         kind === "stream_video" ? { id: "existing-video" } : kind === "stream_audio" ? { id: "existing-audio" } : undefined,
      );

      await act(async () => {
         await result.current.openScreenShare();
      });

      const callback = mocks.updateModals.mock.calls[0][0].screenShare.callback;

      await act(async () => {
         await callback({
            stream: createMockMediaStream(),
            type: "display",
            isAudioEnabled: true,
            isSimulcastEnabled: true,
            maxAudioBitrate: 32000,
            maxVideoBitrate: 1000000,
            sourceName: "Screen 1",
         });
      });

      expect(mockClient.voice.stream.updateVideoBitrate).toHaveBeenCalledWith(1000000);
      expect(mockClient.voice.stream.updateAudioBitrate).toHaveBeenCalledWith(32000);

      expect(mockClient.voice.stream.replaceStreamVideoTrack).toHaveBeenCalled();
      expect(mockClient.voice.stream.replaceStreamAudioTrack).toHaveBeenCalled();
      expect(mockClient.voice.stopAudioLoopback).toHaveBeenCalled();
   });

   it("callback opens a audio stream for a video stream that didn't have audio", async () => {
      const { result } = renderHook(() => useVoiceUtils());
      mockClient.voice.transport.getProducer.mockImplementation((kind: string) => (kind === "stream_video" ? { id: "existing-video" } : undefined));

      await act(async () => {
         await result.current.openScreenShare();
      });

      const callback = mocks.updateModals.mock.calls[0][0].screenShare.callback;

      await act(async () => {
         await callback({
            stream: createMockMediaStream(),
            type: "display",
            isAudioEnabled: true,
            isSimulcastEnabled: true,
            maxAudioBitrate: 32000,
            maxVideoBitrate: 1000000,
            sourceName: "Screen 1",
         });
      });

      expect(mockClient.voice.stream.replaceStreamVideoTrack).toHaveBeenCalled();
      expect(mockClient.voice.stream.openStream).toHaveBeenCalledOnce();
   });

   it("callback starts an audio loopback when a display capture has no audio track but audio is enabled", async () => {
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.openScreenShare();
      });

      const callback = mocks.updateModals.mock.calls[0][0].screenShare.callback;
      const stream = createMockMediaStream(false, true);

      await act(async () => {
         await callback({
            stream,
            type: "display",
            isAudioEnabled: true,
            isSimulcastEnabled: false,
            sourceName: "Screen 1",
         });
      });

      expect(mockClient.voice.startAudioLoopback).toHaveBeenCalledWith("Screen 1");
   });

   it("callback shows an error modal and closes the stream when opening fails", async () => {
      mockClient.voice.stream.openStream.mockRejectedValue(new Error("boom"));
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.openScreenShare();
      });

      const callback = mocks.updateModals.mock.calls[0][0].screenShare.callback;
      const stream = createMockMediaStream();

      await act(async () => {
         await callback({
            stream,
            type: "display",
            isAudioEnabled: false,
            isSimulcastEnabled: false,
         });
      });

      expect(mocks.updateModals).toHaveBeenCalledWith(
         expect.objectContaining({
            info: expect.objectContaining({ status: "error", title: "Screen Sharing Failed" }),
         }),
      );
      expect(mockClient.voice.stream.closeStream).toHaveBeenCalled();
   });
});

// ---------------------------------------------------------------------------
// openAudioStream
// ---------------------------------------------------------------------------

describe("openAudioStream", () => {
   it("exits fullscreen if active", () => {
      mocks.isFullscreen = true;
      mocks.environment = "desktop";
      const { result } = renderHook(() => useVoiceUtils());

      act(() => {
         result.current.openAudioStream();
      });

      expect(mocks.toggleFullscreen).toHaveBeenCalled();
   });

   it("does nothing when the environment is not desktop", () => {
      mocks.environment = "browser";
      const { result } = renderHook(() => useVoiceUtils());

      act(() => {
         result.current.openAudioStream();
      });

      expect(mocks.updateModals).not.toHaveBeenCalled();
   });

   it("opens the stream-audio modal on desktop", () => {
      mocks.environment = "desktop";
      const { result } = renderHook(() => useVoiceUtils());

      act(() => {
         result.current.openAudioStream();
      });

      expect(mocks.updateModals).toHaveBeenCalledWith(expect.objectContaining({ streamAudio: expect.objectContaining({ isOpen: true }) }));
   });

   it("callback opens a new audio stream when no audio producer exists", async () => {
      mocks.environment = "desktop";
      mockClient.voice.transport.getProducer.mockReturnValue(undefined);
      const { result } = renderHook(() => useVoiceUtils());

      act(() => {
         result.current.openAudioStream();
      });
      const callback = mocks.updateModals.mock.calls[0][0].streamAudio.callback;

      await act(async () => {
         await callback("process-123");
      });

      expect(mockClient.voice.stopAudioLoopback).toHaveBeenCalled();
      expect(mockClient.voice.startAudioLoopback).toHaveBeenCalledWith(undefined, "process-123");
      expect(mockClient.voice.stream.openStream).toHaveBeenCalled();
   });

   it("callback replaces the audio track when an audio producer already exists", async () => {
      mocks.environment = "desktop";
      mockClient.voice.transport.getProducer.mockReturnValue({ id: "existing-audio" });
      const { result } = renderHook(() => useVoiceUtils());

      act(() => {
         result.current.openAudioStream();
      });
      const callback = mocks.updateModals.mock.calls[0][0].streamAudio.callback;

      await act(async () => {
         await callback("process-123");
      });

      expect(mockClient.voice.stream.replaceStreamAudioTrack).toHaveBeenCalled();
   });

   it("callback shows an error modal and closes the stream when the audio track comes back empty", async () => {
      mocks.environment = "desktop";
      mockClient.voice.startAudioLoopback.mockResolvedValue(null);
      const { result } = renderHook(() => useVoiceUtils());

      act(() => {
         result.current.openAudioStream();
      });
      const callback = mocks.updateModals.mock.calls[0][0].streamAudio.callback;

      await act(async () => {
         await callback("process-123");
      });

      expect(mocks.updateModals).toHaveBeenCalledWith(
         expect.objectContaining({
            info: expect.objectContaining({ status: "error", title: "Audio Stream Failed" }),
         }),
      );
   });
});

// ---------------------------------------------------------------------------
// openCamera
// ---------------------------------------------------------------------------

describe("openCamera", () => {
   it("opens the camera when no camera producer exists", async () => {
      mockClient.voice.transport.getProducer.mockReturnValue(undefined);
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.openCamera();
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
         video: { deviceId: mocks.settings.cameraDeviceId, frameRate: 30 },
      });
      expect(mockClient.voice.device.openCamera).toHaveBeenCalled();
   });

   it("replaces the camera track when a camera producer already exists", async () => {
      mockClient.voice.transport.getProducer.mockReturnValue({ id: "existing-camera" });
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.openCamera();
      });

      expect(mockClient.voice.device.replaceCameraTrack).toHaveBeenCalled();
      expect(mockClient.voice.device.openCamera).not.toHaveBeenCalled();
   });

   it("shows an error modal and closes the camera when getUserMedia rejects", async () => {
      const mediaError = new Error("no camera found");
      (navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>).mockRejectedValue(mediaError);
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.openCamera();
      });

      expect(mocks.updateModals).toHaveBeenCalledWith(
         expect.objectContaining({
            info: expect.objectContaining({ status: "error", title: "Opening Camera Failed" }),
         }),
      );
   });
});

// ---------------------------------------------------------------------------
// consumeStream
// ---------------------------------------------------------------------------

describe("consumeStream", () => {
   const userId = "user-42" as never;
   const guildId = "guild-1" as never;
   const channelId = "channel-1" as never;

   it("shows an error modal when voice is disconnected", async () => {
      mockClient.voice.status = "disconnected";
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.consumeStream(userId, guildId, channelId);
      });

      expect(mocks.updateModals).toHaveBeenCalledWith(
         expect.objectContaining({
            info: expect.objectContaining({ status: "error", title: "Watching/Listening Stream Failed" }),
         }),
      );
   });

   it("connects to voice when not already connected/ready", async () => {
      mockClient.voice.status = "connecting";
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.consumeStream(userId, guildId, channelId);
      });

      expect(mockClient.voiceManager.connectVoice).toHaveBeenCalledWith(guildId, channelId);
   });

   it("does not reconnect when voice is already ready", async () => {
      mockClient.voice.status = "ready";
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.consumeStream(userId, guildId, channelId);
      });

      expect(mockClient.voiceManager.connectVoice).not.toHaveBeenCalled();
   });

   it("creates video and audio consumers when matching remote producers exist", async () => {
      mockClient.voice.status = "ready";
      mockClient.voice.transport.getRemoteProducers.mockReturnValue([
         { kind: "stream_video", userId },
         { kind: "stream_audio", userId },
      ]);
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.consumeStream(userId, guildId, channelId);
      });

      expect(mockClient.voice.transport.createConsumer).toHaveBeenCalledWith(userId, "stream_video");
      expect(mockClient.voice.transport.createConsumer).toHaveBeenCalledWith(userId, "stream_audio");
   });

   it("does not create consumers when no matching remote producers exist", async () => {
      mockClient.voice.status = "ready";
      mockClient.voice.transport.getRemoteProducers.mockReturnValue([]);
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.consumeStream(userId, guildId, channelId);
      });

      expect(mockClient.voice.transport.createConsumer).not.toHaveBeenCalled();
   });

   it("falls back to unconsumeStream on failure", async () => {
      mockClient.voice.status = "ready";
      mockClient.voice.transport.getRemoteProducers.mockReturnValue([{ kind: "stream_video", userId }]);
      mockClient.voice.transport.createConsumer.mockRejectedValue(new Error("consumer failed"));
      mockClient.voice.transport.getConsumer.mockReturnValue({ id: "consumer-1" });
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.consumeStream(userId, guildId, channelId);
      });

      expect(mockClient.voice.transport.closeConsumer).toHaveBeenCalled();
   });
});

// ---------------------------------------------------------------------------
// unconsumeStream
// ---------------------------------------------------------------------------

describe("unconsumeStream", () => {
   const userId = "user-42" as never;

   it("closes both video and audio consumers when present", async () => {
      mockClient.voice.transport.getConsumer.mockImplementation((_id: string, kind: string) => ({
         id: `${kind}-consumer`,
      }));
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.unconsumeStream(userId);
      });

      expect(mockClient.voice.transport.closeConsumer).toHaveBeenCalledWith("stream_video-consumer");
      expect(mockClient.voice.transport.closeConsumer).toHaveBeenCalledWith("stream_audio-consumer");
   });

   it("does nothing when no consumers exist", async () => {
      mockClient.voice.transport.getConsumer.mockReturnValue(undefined);
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.unconsumeStream(userId);
      });

      expect(mockClient.voice.transport.closeConsumer).not.toHaveBeenCalled();
   });

   it("shows an error modal when closing a consumer fails", async () => {
      mockClient.voice.transport.getConsumer.mockReturnValue({ id: "consumer-1" });
      mockClient.voice.transport.closeConsumer.mockRejectedValue(new Error("close failed"));
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.unconsumeStream(userId);
      });

      expect(mocks.updateModals).toHaveBeenCalledWith(
         expect.objectContaining({
            info: expect.objectContaining({ status: "error", title: "Unwatching/Unlistening Stream Failed" }),
         }),
      );
   });
});

// ---------------------------------------------------------------------------
// changeStream
// ---------------------------------------------------------------------------

describe("changeStream", () => {
   it("opens an audio stream when only an audio producer exists", async () => {
      mocks.environment = "desktop";
      mockClient.voice.transport.getProducer.mockImplementation((kind: string) => (kind === "stream_audio" ? { id: "audio-producer" } : undefined));
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.changeStream();
      });

      expect(mocks.updateModals).toHaveBeenCalledWith(expect.objectContaining({ streamAudio: expect.anything() }));
   });

   it("opens screen share when both a video and audio producer exist", async () => {
      mockClient.voice.transport.getProducer.mockReturnValue({ id: "producer" });
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.changeStream();
      });

      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled();
   });

   it("opens screen share when neither producer exists", async () => {
      mockClient.voice.transport.getProducer.mockReturnValue(undefined);
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.changeStream();
      });

      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled();
   });
});

// ---------------------------------------------------------------------------
// updateStream
// ---------------------------------------------------------------------------

describe("updateStream", () => {
   it("updates video parameters when video options are given", async () => {
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.updateStream({ width: 1280, height: 720, frameRate: 30 });
      });

      expect(mockClient.voice.stream.updateVideoParameters).toHaveBeenCalledWith({
         width: 1280,
         height: 720,
         frameRate: 30,
      });
   });

   it("updates audio bitrate when audio.maxBitrate is given", async () => {
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.updateStream(undefined, { maxBitrate: 96000 });
      });

      expect(mockClient.voice.stream.updateAudioBitrate).toHaveBeenCalledWith(96000);
   });

   it("does not update audio bitrate when maxBitrate is not provided", async () => {
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.updateStream(undefined, {});
      });

      expect(mockClient.voice.stream.updateAudioBitrate).not.toHaveBeenCalled();
   });

   it("shows an error modal when updating fails", async () => {
      mockClient.voice.stream.updateVideoParameters.mockRejectedValue(new Error("fail"));
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.updateStream({ width: 100 });
      });

      expect(mocks.updateModals).toHaveBeenCalledWith(
         expect.objectContaining({
            info: expect.objectContaining({ status: "error", title: "Updating Stream Failed" }),
         }),
      );
   });
});

// ---------------------------------------------------------------------------
// closeStream / closeCamera
// ---------------------------------------------------------------------------

describe("closeStream", () => {
   it("closes the stream successfully", async () => {
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.closeStream();
      });

      expect(mockClient.voice.stream.closeStream).toHaveBeenCalled();
   });

   it("shows an error modal when closing fails", async () => {
      mockClient.voice.stream.closeStream.mockRejectedValue(new Error("fail"));
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.closeStream();
      });

      expect(mocks.updateModals).toHaveBeenCalledWith(
         expect.objectContaining({
            info: expect.objectContaining({ status: "error", title: "Closing Screen Sharing Failed" }),
         }),
      );
   });
});

describe("closeCamera", () => {
   it("closes the camera successfully", async () => {
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.closeCamera();
      });

      expect(mockClient.voice.device.closeCamera).toHaveBeenCalled();
   });

   it("shows an error modal when closing fails", async () => {
      mockClient.voice.device.closeCamera.mockRejectedValue(new Error("fail"));
      const { result } = renderHook(() => useVoiceUtils());

      await act(async () => {
         await result.current.closeCamera();
      });

      expect(mocks.updateModals).toHaveBeenCalledWith(
         expect.objectContaining({
            info: expect.objectContaining({ status: "error", title: "Closing Camera Failed" }),
         }),
      );
   });
});
