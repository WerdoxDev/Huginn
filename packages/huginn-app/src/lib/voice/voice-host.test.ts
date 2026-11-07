import type { HuginnClient } from "@huginnjs/api";

import { EventEmitter } from "@huginnjs/shared";
import { storageStore } from "@stores/storageStore";
import { windowStore } from "@stores/windowStore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Platform } from "@/types";

import type { VoiceBridge } from "./voice-bridge";
import type { VoiceMessage, VoiceStreamUpdate } from "./voice-protocol";

import { VoiceHost } from "./voice-host";

vi.mock("@lib/sync-zustand", () => ({ syncZustandStore: vi.fn() }));

class FakeBroadcastChannel extends EventTarget {
   public onmessage?: (event: MessageEvent<VoiceMessage>) => void;
   public postMessage = vi.fn();
   public close = vi.fn();
}

let channel: FakeBroadcastChannel;
let host: VoiceHost;
let voice: ReturnType<typeof makeVoice>;

function makeVoice() {
   return {
      client: {
         currentUser: { id: "self" },
         voiceManager: {
            voiceState: {
               gatewayVoiceState: { isAudioMuted: true, isAudioDeafened: false },
               updateGatewayVoiceState: vi.fn(async (update: Partial<{ isAudioMuted: boolean; isAudioDeafened: boolean }>) => {
                  Object.assign(voice.client.voiceManager.voiceState.gatewayVoiceState, update);
               }),
            },
         },
      },
      isMicrophoneUnavailable: false,
      ensureMicrophoneAvailable: vi.fn(async () => {}),
      transport: Object.assign(new EventEmitter(), {
         getConsumers: () => [],
         getProducers: () => [],
         getRemoteConsumers: () => [],
         getRemoteProducers: () => [],
      }),
      stream: Object.assign(new EventEmitter(), {
         updateVideoParameters: vi.fn(async (_options: VoiceStreamUpdate["video"]) => {}),
         updateVideoBitrate: vi.fn(async (_bitrate: number) => {}),
         updateAudioBitrate: vi.fn(async (_bitrate: number) => {}),
      }),
      getDesktopCaptureOptions: vi.fn<VoiceBridge["getDesktopCaptureOptions"]>(() => undefined),
      updateDesktopCaptureOptions: vi.fn<VoiceBridge["updateDesktopCaptureOptions"]>(),
      updateDesktopCapture: vi.fn(async (_options: VoiceStreamUpdate["video"]) => {}),
   };
}

beforeEach(() => {
   channel = new FakeBroadcastChannel();
   vi.stubGlobal(
      "BroadcastChannel",
      class {
         constructor() {
            return channel;
         }
      },
   );
   windowStore.setState({ environment: "browser", platform: undefined });
   voice = makeVoice();
   host = new VoiceHost("host", voice as unknown as VoiceBridge, voice.client as unknown as HuginnClient<VoiceBridge>);
});

afterEach(() => {
   host.dispose();
   vi.unstubAllGlobals();
});

async function updateStream(data: VoiceStreamUpdate) {
   channel.onmessage?.(
      new MessageEvent("message", {
         data: { kind: "request", hostId: "host", requestId: "update", type: "update_stream", data },
      }),
   );
   await vi.waitFor(() =>
      expect(channel.postMessage).toHaveBeenCalledWith({
         kind: "result",
         hostId: "host",
         requestId: "update",
         type: "update_stream",
         result: undefined,
      }),
   );
}

describe("stream settings", () => {
   it.each([undefined, "win32", "linux"] as Array<Platform | undefined>)(
      "updates browser sharing without desktop capture options on %s",
      async (platform) => {
         windowStore.setState({ platform });
         const video = { width: 1280, height: 720, frameRate: 60, maxBitrate: 2_000_000 };
         const audio = { maxBitrate: 96_000 };

         await updateStream({ video, audio });

         expect(voice.stream.updateVideoParameters).toHaveBeenCalledWith(video);
         expect(voice.stream.updateAudioBitrate).toHaveBeenCalledWith(audio.maxBitrate);
         expect(voice.updateDesktopCaptureOptions).not.toHaveBeenCalled();
         expect(voice.updateDesktopCapture).not.toHaveBeenCalled();
      },
   );

   it("retains requested capture settings for Windows desktop sharing", async () => {
      windowStore.setState({ environment: "desktop", platform: "win32" });
      voice.getDesktopCaptureOptions.mockReturnValue({ width: 1920, height: 1080, frameRate: 30 });
      const video = { frameRate: 60 };

      await updateStream({ video });

      expect(voice.stream.updateVideoParameters).toHaveBeenCalledWith(video);
      expect(voice.updateDesktopCaptureOptions).toHaveBeenCalledWith(video);
   });

   it("restarts Linux desktop capture for resolution and FPS updates", async () => {
      windowStore.setState({ environment: "desktop", platform: "linux" });
      const captureOptions = { width: 1280, height: 720, frameRate: 60 };

      await updateStream({ video: { ...captureOptions, maxBitrate: 2_000_000 } });

      expect(voice.updateDesktopCapture).toHaveBeenCalledWith(captureOptions);
      expect(voice.stream.updateVideoBitrate).toHaveBeenCalledWith(2_000_000);
      expect(voice.stream.updateVideoParameters).not.toHaveBeenCalled();
   });
});

async function requestVoiceControl(type: "toggle_mute" | "toggle_deafen", error?: string) {
   channel.onmessage?.(
      new MessageEvent("message", {
         data: { kind: "request", hostId: "host", requestId: "control", type, data: undefined },
      }),
   );
   await vi.waitFor(() =>
      expect(channel.postMessage).toHaveBeenCalledWith({
         kind: "result",
         hostId: "host",
         requestId: "control",
         type,
         ...(error ? { error } : { result: undefined }),
      }),
   );
}

describe("microphone controls", () => {
   it("keeps the user muted and returns the missing microphone error", async () => {
      const message = "No microphone was found. Connect a microphone and try again.";
      voice.ensureMicrophoneAvailable.mockRejectedValueOnce(new Error(message));

      await requestVoiceControl("toggle_mute", message);

      expect(voice.client.voiceManager.voiceState.updateGatewayVoiceState).not.toHaveBeenCalled();
      expect(voice.client.voiceManager.voiceState.gatewayVoiceState.isAudioMuted).toBe(true);
   });

   it("unmutes after a microphone becomes available", async () => {
      await requestVoiceControl("toggle_mute");

      expect(voice.ensureMicrophoneAvailable).toHaveBeenCalled();
      expect(voice.client.voiceManager.voiceState.gatewayVoiceState.isAudioMuted).toBe(false);
      expect(storageStore.getState().cache.settings.isVoiceMuted).toBe(false);
   });

   it("allows undeafening without unmuting when no microphone is available", async () => {
      voice.isMicrophoneUnavailable = true;
      voice.client.voiceManager.voiceState.gatewayVoiceState.isAudioDeafened = true;
      await storageStore.getState().updateSettings({ isVoiceMuted: false });

      await requestVoiceControl("toggle_deafen");

      expect(voice.client.voiceManager.voiceState.gatewayVoiceState).toEqual({ isAudioMuted: true, isAudioDeafened: false });
      expect(voice.ensureMicrophoneAvailable).not.toHaveBeenCalled();
   });
});

describe("camera inversion", () => {
   it.each([true, false])("persists an inversion request from a popout: %s", async (isCameraInverted) => {
      await storageStore.getState().updateSettings({ isCameraInverted: !isCameraInverted });
      channel.onmessage?.(
         new MessageEvent("message", {
            data: {
               kind: "request",
               hostId: "host",
               requestId: "invert",
               type: "set_camera_inverted",
               data: { isCameraInverted },
            },
         }),
      );

      await vi.waitFor(() =>
         expect(channel.postMessage).toHaveBeenCalledWith({
            kind: "result",
            hostId: "host",
            requestId: "invert",
            type: "set_camera_inverted",
            result: undefined,
         }),
      );
      expect(storageStore.getState().cache.settings.isCameraInverted).toBe(isCameraInverted);
      const saved = await storageStore.getState().storage.loadFile("settings");
      expect(saved.data.isCameraInverted).toBe(isCameraInverted);
   });
});
