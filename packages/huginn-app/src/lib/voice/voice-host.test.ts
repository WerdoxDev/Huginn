import type { HuginnClient } from "@huginnjs/api";

import { EventEmitter } from "@huginnjs/shared";
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
      client: { currentUser: { id: "self" } },
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
   host = new VoiceHost("host", voice as unknown as VoiceBridge, voice.client as HuginnClient<VoiceBridge>);
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
