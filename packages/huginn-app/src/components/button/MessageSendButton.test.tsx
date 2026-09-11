import { MessageFlags } from "@huginnjs/shared";
import { useChannelStore } from "@stores/channelStore";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MessageSendButton from "./MessageSendButton";

const mocks = vi.hoisted(() => ({
   acquire: vi.fn(),
   createAudioWaveform: vi.fn(),
   getMediaErrorMessage: vi.fn(),
   getStream: vi.fn(),
   releaseInput: vi.fn(),
   showError: vi.fn(),
}));

vi.mock("@lib/voice/voice-input-device", () => ({
   VoiceInputDevice: {
      acquire: mocks.acquire,
      getStream: mocks.getStream,
   },
}));

vi.mock("@stores/modalsStore", () => ({
   useModals: () => ({ showError: mocks.showError }),
}));

vi.mock("@stores/storageStore", () => ({
   useStorage: () => ({ inputDeviceId: "default", inputVolume: 100, noiseSuppression: true }),
}));

vi.mock("@/lib/audio-waveform", () => ({
   createAudioWaveform: mocks.createAudioWaveform,
}));

vi.mock("@/lib/utils", () => ({
   getMediaErrorMessage: mocks.getMediaErrorMessage,
}));

vi.mock("mediabunny", () => {
   class MockBufferTarget {
      buffer?: ArrayBuffer;
   }

   class MockOutput {
      target: MockBufferTarget;

      constructor(options: { target: MockBufferTarget }) {
         this.target = options.target;
      }
   }

   return {
      ALL_FORMATS: [],
      BlobSource: class {},
      BufferTarget: MockBufferTarget,
      Input: class {},
      OggOutputFormat: class {},
      Output: MockOutput,
      Conversion: {
         init: vi.fn(async ({ output }: { output: MockOutput }) => ({
            execute: vi.fn(async () => {
               output.target.buffer = new ArrayBuffer(4);
            }),
         })),
      },
   };
});

const recorderInstances: MockMediaRecorder[] = [];

class MockMediaRecorder {
   static isTypeSupported() {
      return true;
   }

   state: RecordingState = "inactive";
   ondataavailable: ((event: BlobEvent) => void) | null = null;
   onerror: ((event: Event) => void) | null = null;
   onstop: ((event: Event) => void) | null = null;

   constructor() {
      recorderInstances.push(this);
   }

   start() {
      this.state = "recording";
   }

   stop() {
      this.state = "inactive";
      this.ondataavailable?.({ data: new Blob(["audio"], { type: "audio/webm" }) } as BlobEvent);
      this.onstop?.(new Event("stop"));
   }
}

function createInputStream() {
   const clonedTrack = { stop: vi.fn() };
   return {
      clonedTrack,
      stream: {
         getAudioTracks: () => [{ clone: () => clonedTrack }],
      } as unknown as MediaStream,
   };
}

async function startRecording(button: HTMLButtonElement) {
   fireEvent.pointerDown(button, { button: 0, pointerId: 1 });
   await act(async () => {
      vi.advanceTimersByTime(250);
      await Promise.resolve();
   });
}

beforeEach(() => {
   vi.useFakeTimers();
   recorderInstances.length = 0;
   mocks.acquire.mockReset().mockReturnValue(mocks.releaseInput);
   mocks.createAudioWaveform.mockReset().mockResolvedValue("waveform");
   mocks.getMediaErrorMessage.mockReset().mockReturnValue("Microphone permission is required.");
   mocks.getStream.mockReset().mockResolvedValue(createInputStream().stream);
   mocks.releaseInput.mockReset();
   mocks.showError.mockReset();
   useChannelStore.setState({ isRecordingVoice: false, isVoiceRecordingLocked: false, voiceRecordingDuration: 0 });

   vi.stubGlobal(
      "MediaStream",
      class {
         constructor(public tracks: MediaStreamTrack[]) {}
      },
   );
   vi.stubGlobal("MediaRecorder", MockMediaRecorder);

   Object.defineProperties(HTMLButtonElement.prototype, {
      setPointerCapture: { configurable: true, value: vi.fn() },
      releasePointerCapture: { configurable: true, value: vi.fn() },
      hasPointerCapture: { configurable: true, value: vi.fn(() => true) },
   });
});

afterEach(() => {
   vi.useRealTimers();
   vi.unstubAllGlobals();
});

describe("MessageSendButton voice recording", () => {
   it("submits the first recording directly without composer attachment state", async () => {
      const onSubmit = vi.fn();
      const { container } = render(<MessageSendButton onSubmit={onSubmit} hasDraft={false} />);
      const button = container.querySelector("button")!;

      await startRecording(button);
      expect(recorderInstances).toHaveLength(1);

      await act(async () => {
         vi.advanceTimersByTime(1_250);
      });
      expect(useChannelStore.getState().voiceRecordingDuration).toBe(1.25);

      fireEvent.pointerUp(button, { button: 0, pointerId: 1 });
      await act(async () => {
         await Promise.resolve();
         await Promise.resolve();
         await Promise.resolve();
      });

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
         MessageFlags.VOICE_MESSAGE,
         expect.arrayContaining([
            expect.objectContaining({
               contentType: "audio/ogg",
               filename: "voice-message.ogg",
               waveform: "waveform",
            }),
         ]),
      );
   });

   it("reports denied microphone access and returns to the idle state", async () => {
      mocks.getStream.mockRejectedValueOnce(new DOMException("denied", "NotAllowedError"));
      const { container } = render(<MessageSendButton onSubmit={vi.fn()} hasDraft={false} />);

      await startRecording(container.querySelector("button")!);
      await act(async () => {
         await Promise.resolve();
      });

      expect(mocks.showError).toHaveBeenCalledWith("Microphone permission is required.");
      expect(useChannelStore.getState().isRecordingVoice).toBe(false);
   });

   it("locks and starts recording after the pointer is released during a permission prompt", async () => {
      let resolveInput!: (stream: MediaStream) => void;
      mocks.getStream.mockReturnValueOnce(
         new Promise<MediaStream>((resolve) => {
            resolveInput = resolve;
         }),
      );
      const onSubmit = vi.fn();
      const { container } = render(<MessageSendButton onSubmit={onSubmit} hasDraft={false} />);
      const button = container.querySelector("button")!;

      await startRecording(button);
      fireEvent.pointerUp(button, { button: 0, pointerId: 1 });

      await act(async () => {
         resolveInput(createInputStream().stream);
         await Promise.resolve();
      });

      expect(recorderInstances).toHaveLength(1);
      expect(recorderInstances[0].state).toBe("recording");
      expect(useChannelStore.getState().isVoiceRecordingLocked).toBe(true);
      expect(onSubmit).not.toHaveBeenCalled();
      expect(mocks.releaseInput).not.toHaveBeenCalled();
   });
});
