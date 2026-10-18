import type { VoiceWindowHost } from "@lib/voice/voice-protocol";
import type { useModals } from "@stores/modalsStore";

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MediaSource } from "@/types";

const mocks = vi.hoisted(() => ({
   sendMessage: vi.fn(),
   updateModals: vi.fn(),
   toggleFullscreen: vi.fn(),
   isFullscreen: false,
   environment: "browser",
   mediaSources: [] as MediaSource[],
}));

vi.mock("@lib/voice/voice-client", () => ({
   VoiceClient: { sendMessage: mocks.sendMessage, getHostId: () => "host" },
}));
vi.mock("./useMediaSources", () => ({ useVoiceSnapshot: () => ({ mediaSources: mocks.mediaSources }) }));
vi.mock("@hooks/useFullscreen", () => ({
   useFullscreen: () => ({ isFullscreen: mocks.isFullscreen, toggleFullscreen: mocks.toggleFullscreen }),
}));
vi.mock("@stores/modalsStore", () => ({ useModals: () => ({ updateModals: mocks.updateModals }) }));
vi.mock("@stores/storageStore", () => ({ useStorage: () => ({ cameraDeviceId: "camera" }) }));
vi.mock("@stores/windowStore", () => ({ useHuginnWindow: () => ({ environment: mocks.environment }) }));

import { useVoiceUtils } from "./useVoiceUtils";

const audioTrack = { kind: "audio" } as MediaStreamTrack;
const videoTrack = { kind: "video" } as MediaStreamTrack;
let host: VoiceWindowHost;
let getDisplayMedia: ReturnType<typeof vi.fn>;

beforeEach(() => {
   vi.clearAllMocks();
   mocks.sendMessage.mockReset().mockResolvedValue(undefined);
   mocks.environment = "browser";
   mocks.isFullscreen = false;
   mocks.mediaSources = [];
   host = { hostId: "host", getTrack: () => null, openStream: vi.fn().mockResolvedValue(undefined) };
   window.voiceHost = host;
   getDisplayMedia = vi.fn().mockResolvedValue({ getAudioTracks: () => [audioTrack], getVideoTracks: () => [videoTrack] });
   vi.stubGlobal("navigator", { mediaDevices: { getDisplayMedia } });
});

afterEach(() => {
   delete window.voiceHost;
   vi.unstubAllGlobals();
});

type Modals = ReturnType<typeof useModals>;

function modal<K extends "screenShare" | "audioStream">(name: K): Modals[K] {
   const update = mocks.updateModals.mock.calls.find(([value]) => value[name]);
   expect(update).toBeDefined();
   return update![0][name];
}

function expectError(title: string) {
   expect(mocks.updateModals).toHaveBeenCalledWith({
      info: expect.objectContaining({ isOpen: true, status: "error", title, text: expect.any(String) }),
   });
}

describe("voice controls", () => {
   it.each([
      ["toggleMute", "toggle_mute"],
      ["toggleDeafen", "toggle_deafen"],
      ["closeStream", "close_stream"],
      ["closeCamera", "close_camera"],
      ["openPopout", "open_popout"],
   ] as const)("%s requests the corresponding host action", async (action, message) => {
      const { result } = renderHook(() => useVoiceUtils());

      await act(() => result.current[action]());

      expect(mocks.sendMessage).toHaveBeenCalledWith(message);
   });

   it("opens the selected camera and can flip between front and rear cameras", async () => {
      const { result } = renderHook(() => useVoiceUtils());
      await act(() => result.current.openCamera());
      expect(mocks.sendMessage).toHaveBeenLastCalledWith("open_camera", { deviceId: "camera", frameRate: 30 });

      await act(() => result.current.flipCamera("user"));
      expect(mocks.sendMessage).toHaveBeenLastCalledWith("open_camera", { facingMode: "environment", frameRate: 30 });
      await act(() => result.current.flipCamera("environment"));
      expect(mocks.sendMessage).toHaveBeenLastCalledWith("open_camera", { facingMode: "user", frameRate: 30 });
   });

   it("requests stream quality changes and starts and stops watching another user", async () => {
      const { result } = renderHook(() => useVoiceUtils());
      const video = { width: 1280, height: 720, frameRate: 30 };
      const audio = { maxBitrate: 96000 };

      await act(() => result.current.updateStream(video, audio));
      expect(mocks.sendMessage).toHaveBeenLastCalledWith("update_stream", { video, audio });
      await act(() => result.current.consumeStream("user", null, "channel"));
      expect(mocks.sendMessage).toHaveBeenLastCalledWith("consume_stream", { userId: "user", guildId: null, channelId: "channel" });
      await act(() => result.current.unconsumeStream("user"));
      expect(mocks.sendMessage).toHaveBeenLastCalledWith("unconsume_stream", { userId: "user" });
   });

   it.each([
      ["openCamera", "Opening Camera Failed"],
      ["closeCamera", "Closing Camera Failed"],
      ["closeStream", "Closing Screen Sharing Failed"],
   ] as const)("shows a useful error when %s fails", async (action, title) => {
      mocks.sendMessage.mockRejectedValueOnce(new Error("device unavailable"));
      const { result } = renderHook(() => useVoiceUtils());

      await act(() => result.current[action]());

      expectError(title);
   });

   it("stops watching after a failed subscription and reports the failure", async () => {
      mocks.sendMessage.mockRejectedValueOnce(new Error("stream unavailable"));
      const { result } = renderHook(() => useVoiceUtils());

      await act(() => result.current.consumeStream("user", null, "channel"));

      expectError("Watching/Listening Stream Failed");
      expect(mocks.sendMessage).toHaveBeenLastCalledWith("unconsume_stream", { userId: "user" });
   });
});

describe("screen and audio sharing", () => {
   it.each([true, false])("shares browser capture with audio available: %s", async (withAudio) => {
      getDisplayMedia.mockResolvedValue({ getAudioTracks: () => (withAudio ? [audioTrack] : []), getVideoTracks: () => [videoTrack] });
      mocks.isFullscreen = true;
      const { result } = renderHook(() => useVoiceUtils());

      await act(() => result.current.openScreenShare());

      expect(getDisplayMedia).toHaveBeenCalledWith({ audio: true, video: true });
      expect(host.openStream).toHaveBeenCalledWith(videoTrack, withAudio ? audioTrack : undefined);
      expect(mocks.toggleFullscreen).toHaveBeenCalled();
   });

   it("reports capture failure and releases the stream", async () => {
      getDisplayMedia.mockRejectedValue(new Error("permission denied"));
      const { result } = renderHook(() => useVoiceUtils());

      await act(() => result.current.openScreenShare());

      expectError("Screen Sharing Failed");
      expect(mocks.sendMessage).toHaveBeenCalledWith("close_stream");
   });

   it("reports an unavailable voice host after capture", async () => {
      delete window.voiceHost;
      const { result } = renderHook(() => useVoiceUtils());

      await act(() => result.current.openScreenShare());

      expectError("Screen Sharing Failed");
   });

   it.each([false, true])("opens the desktop picker for an existing share: %s", async (existing) => {
      mocks.environment = "desktop";
      mocks.mediaSources = existing ? [{ kind: "stream_video", type: "producing" } as MediaSource] : [];
      const { result } = renderHook(() => useVoiceUtils());

      await act(() => result.current.openScreenShare());

      expect(modal("screenShare")).toMatchObject({ isOpen: true, type: existing ? "change" : "create" });
      expect(getDisplayMedia).not.toHaveBeenCalled();
   });

   it("passes the desktop capture selection to the host", async () => {
      mocks.environment = "desktop";
      const { result } = renderHook(() => useVoiceUtils());
      await act(() => result.current.openScreenShare());
      const options = {
         type: "screen",
         name: "Screen",
         width: 1920,
         height: 1080,
         frameRate: 30,
         maxAudioBitrate: 128000,
         maxVideoBitrate: 2000000,
         isAudioEnabled: true,
         isSimulcastEnabled: true,
      } as const;

      await act(async () => {
         await modal("screenShare").callback?.(options);
      });

      expect(mocks.sendMessage).toHaveBeenCalledWith("open_captured_stream", options);
   });

   it("reports a failed desktop capture request and closes the stream", async () => {
      mocks.environment = "desktop";
      const { result } = renderHook(() => useVoiceUtils());
      await act(() => result.current.openScreenShare());
      mocks.sendMessage.mockRejectedValueOnce(new Error("capture failed"));
      const options = {
         type: "screen",
         name: "Screen",
         width: 1920,
         height: 1080,
         frameRate: 30,
         maxAudioBitrate: 128000,
         maxVideoBitrate: 2000000,
         isAudioEnabled: true,
         isSimulcastEnabled: true,
      } as const;

      await act(async () => {
         await modal("screenShare").callback?.(options);
      });

      expectError("Screen Sharing Failed");
      expect(mocks.sendMessage).toHaveBeenLastCalledWith("close_stream");
   });

   it("changes an audio-only share using the audio picker", async () => {
      mocks.environment = "desktop";
      mocks.mediaSources = [{ kind: "stream_audio", type: "producing" } as MediaSource];
      const { result } = renderHook(() => useVoiceUtils());
      await act(() => result.current.changeStream());
      const options = { processId: 123, maxAudioBitrate: 128000 };

      await act(async () => {
         await modal("audioStream").callback?.(options);
      });

      expect(modal("audioStream")).toMatchObject({ isOpen: true });
      expect(mocks.sendMessage).toHaveBeenCalledWith("open_audio_stream", options);
   });
});
