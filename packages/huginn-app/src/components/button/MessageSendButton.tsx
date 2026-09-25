import { MessageFlags } from "@huginnjs/shared";
import { VoiceInputDevice } from "@lib/voice/voice-input-device";
import { useChannelStore } from "@stores/channelStore";
import { useModals } from "@stores/modalsStore";
import { useStorage } from "@stores/storageStore";
import clsx from "clsx";
import { ALL_FORMATS, BlobSource, BufferTarget, Conversion, Input, OggOutputFormat, Output } from "mediabunny";
import { useEffect, useRef, useState, type PointerEvent } from "react";

import type { AppAttachment } from "@/types";

import { createAudioWaveform } from "@/lib/audio-waveform";
import { getMediaErrorMessage } from "@/lib/utils";

import { HuginnButton } from "@huginn/frontend-shared";

type RecordingStatus = "idle" | "requesting" | "recording" | "processing";

export default function MessageSendButton(props: { onSubmit: (flags: MessageFlags, attachments?: AppAttachment[]) => void; hasDraft: boolean }) {
   const timeoutRef = useRef<number | undefined>(undefined);
   const releaseInputRef = useRef<(() => void) | null>(null);
   const recorderRef = useRef<MediaRecorder | null>(null);
   const recordingTrackRef = useRef<MediaStreamTrack | null>(null);
   const recordingAttemptRef = useRef(0);
   const isOpeningInputRef = useRef(false);
   const durationIntervalRef = useRef<number | undefined>(undefined);
   const isPointerDownRef = useRef(false);
   const shouldSubmitRef = useRef(false);
   const receivedDataRef = useRef(false);
   const settings = useStorage("settings");
   const { showError } = useModals();
   const lockRef = useRef<HTMLDivElement | null>(null);
   const buttonRef = useRef<HTMLButtonElement | null>(null);
   const cancelRef = useRef<HTMLDivElement | null>(null);
   const [isCancelling, setIsCancelling] = useState(false);
   const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>("idle");
   const { isRecordingVoice, setIsRecordingVoice, isVoiceRecordingLocked, setIsVoiceRecordingLocked, setVoiceRecordingDuration } = useChannelStore();

   function handleClickStart(e: PointerEvent<HTMLButtonElement>) {
      if (e.button !== 0 || props.hasDraft || recordingStatus === "processing") return;

      isPointerDownRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);

      clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
         setIsRecordingVoice(true);
      }, 250);
   }

   function handleClickEnd(e: PointerEvent<HTMLButtonElement>, discard = false) {
      if (props.hasDraft || recordingStatus === "processing") return;

      isPointerDownRef.current = false;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
         e.currentTarget.releasePointerCapture(e.pointerId);
      }

      if (recordingStatus === "requesting") {
         setIsVoiceRecordingLocked(true);
         return;
      }

      if (isVoiceRecordingLocked) return;
      stopRecording(discard || isCancelling);
   }

   function handlePointerCancel(e: PointerEvent<HTMLButtonElement>) {
      handleClickEnd(e, true);
   }

   function handleClickMove(e: PointerEvent<HTMLButtonElement>) {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      if (!buttonRef.current || !lockRef.current || !cancelRef.current) return;
      if (isVoiceRecordingLocked) return;

      const lockRect = lockRef.current.getBoundingClientRect();
      const cancelRect = cancelRef.current.getBoundingClientRect();

      setIsVoiceRecordingLocked(lockRect.bottom >= e.clientY);
      setIsCancelling(cancelRect.right > e.clientX);
   }

   async function startRecording() {
      const attempt = ++recordingAttemptRef.current;
      const releaseInput = VoiceInputDevice.acquire();
      releaseInputRef.current = releaseInput;
      isOpeningInputRef.current = true;
      shouldSubmitRef.current = false;
      receivedDataRef.current = false;
      setRecordingStatus("requesting");
      setVoiceRecordingDuration(0);

      function releaseAcquiredInput() {
         releaseInput();
         if (releaseInputRef.current === releaseInput) releaseInputRef.current = null;
      }

      let track: MediaStreamTrack | undefined;

      try {
         const stream = await VoiceInputDevice.getStream(settings.inputDeviceId, settings.inputVolume, settings.noiseSuppression);
         if (attempt !== recordingAttemptRef.current || !useChannelStore.getState().isRecordingVoice) {
            releaseAcquiredInput();
            return;
         }

         const sourceTrack = stream.getAudioTracks()[0];
         if (!sourceTrack) throw new Error("The selected microphone did not provide an audio track.");
         if (!isPointerDownRef.current) setIsVoiceRecordingLocked(true);

         const clonedTrack = sourceTrack.clone();
         track = clonedTrack;
         recordingTrackRef.current = clonedTrack;
         const preferredMimeTypes = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"];
         const mimeType =
            typeof MediaRecorder.isTypeSupported === "function" ? preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) : undefined;
         const recorder = new MediaRecorder(new MediaStream([clonedTrack]), mimeType ? { mimeType } : undefined);
         recorderRef.current = recorder;
         isOpeningInputRef.current = false;

         recorder.ondataavailable = (event) => {
            receivedDataRef.current = event.data.size > 0;
            if (!shouldSubmitRef.current || event.data.size === 0) return;
            void submitVoiceMessage(event.data);
         };

         recorder.onerror = () => {
            showError("Huginn couldn't record from your microphone. Please try again.");
            stopRecording(true);
         };

         recorder.onstop = () => {
            clonedTrack.stop();
            if (recordingTrackRef.current === clonedTrack) recordingTrackRef.current = null;
            releaseAcquiredInput();
            if (recorderRef.current === recorder) recorderRef.current = null;
            stopDurationTimer();

            if (!shouldSubmitRef.current) {
               setRecordingStatus("idle");
            } else if (!receivedDataRef.current) {
               setRecordingStatus("idle");
               showError("No audio was captured. Please try recording again.");
            }

            shouldSubmitRef.current = false;
         };

         recorder.start();
         setRecordingStatus("recording");
         const startedAt = performance.now();
         durationIntervalRef.current = window.setInterval(() => {
            setVoiceRecordingDuration((performance.now() - startedAt) / 1000);
         }, 250);
      } catch (error) {
         track?.stop();
         if (recordingTrackRef.current === track) recordingTrackRef.current = null;
         if (attempt === recordingAttemptRef.current) recorderRef.current = null;
         releaseAcquiredInput();
         isOpeningInputRef.current = false;

         if (attempt !== recordingAttemptRef.current) return;

         setRecordingStatus("idle");
         setIsVoiceRecordingLocked(false);
         setIsRecordingVoice(false);
         showError(getMediaErrorMessage(error, "audio"));
      }
   }

   async function submitVoiceMessage(recording: Blob) {
      setRecordingStatus("processing");

      try {
         const waveformPromise = createAudioWaveform(recording).catch(() => undefined);
         const input = new Input({ source: new BlobSource(recording), formats: ALL_FORMATS });
         const output = new Output({ format: new OggOutputFormat(), target: new BufferTarget() });
         const conversion = await Conversion.init({ input, output });

         await conversion.execute();

         const arrayBuffer = output.target.buffer;
         if (!arrayBuffer) throw new Error("Voice message conversion produced no output.");

         const waveform = await waveformPromise;
         props.onSubmit(MessageFlags.VOICE_MESSAGE, [
            {
               key: "voice-message",
               data: arrayBuffer,
               filename: "voice-message.ogg",
               contentType: "audio/ogg",
               waveform,
            },
         ]);
      } catch {
         showError("Huginn couldn't process your voice message. Please try again.");
      } finally {
         setRecordingStatus("idle");
      }
   }

   function stopDurationTimer() {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = undefined;
   }

   function stopRecording(discard = false) {
      clearTimeout(timeoutRef.current);
      stopDurationTimer();
      isPointerDownRef.current = false;
      setIsVoiceRecordingLocked(false);
      setIsRecordingVoice(false);
      setVoiceRecordingDuration(0);
      setIsCancelling(false);

      const recorder = recorderRef.current;
      if (recorder?.state === "recording") {
         shouldSubmitRef.current = !discard;
         recorder.stop();
      } else {
         recordingAttemptRef.current++;
         isOpeningInputRef.current = false;
         releaseInputRef.current?.();
         releaseInputRef.current = null;
         recordingTrackRef.current?.stop();
         recordingTrackRef.current = null;
         recorderRef.current = null;
         setRecordingStatus("idle");
      }
   }

   function handleClick() {
      if (recordingStatus === "processing") return;

      if (isRecordingVoice && isVoiceRecordingLocked) {
         stopRecording();
      } else {
         props.onSubmit(MessageFlags.NONE);
      }
   }

   useEffect(() => {
      if (isRecordingVoice) {
         void startRecording();
      } else if (isOpeningInputRef.current || recorderRef.current?.state === "recording") {
         stopRecording(true);
      }
   }, [isRecordingVoice]);

   useEffect(() => {
      return () => {
         recordingAttemptRef.current++;
         shouldSubmitRef.current = false;
         stopDurationTimer();
         if (recorderRef.current?.state === "recording") recorderRef.current.stop();
         recordingTrackRef.current?.stop();
         recordingTrackRef.current = null;
         releaseInputRef.current?.();
         releaseInputRef.current = null;
      };
   }, []);

   return (
      <div className="relative flex items-center justify-center">
         <HuginnButton
            ref={buttonRef}
            color={isCancelling ? "negative" : "primary"}
            className={clsx(
               "flex size-10 cursor-pointer items-center justify-center rounded-full! p-2 transition-all!",
               recordingStatus === "recording" && "scale-125 animate-pulse",
            )}
            disabled={recordingStatus === "processing"}
            type="button"
            onClick={handleClick}
            onPointerDown={handleClickStart}
            onPointerUp={handleClickEnd}
            onPointerCancel={handlePointerCancel}
            onPointerMove={handleClickMove}
            data-keyboard-no-close
         >
            {recordingStatus === "processing" ? (
               <IconMingcuteLoading3Fill className="text-text size-full animate-spin" />
            ) : props.hasDraft || isVoiceRecordingLocked ? (
               <IconLetsIconsSendHorFill className="text-text size-full" />
            ) : (
               <IconMingcuteMicFill className="text-text size-full" />
            )}
         </HuginnButton>
         {isRecordingVoice && (
            <div className="bg-surface-alt absolute -top-32 -right-1 z-20 size-12 rounded-full p-2" ref={lockRef}>
               {isVoiceRecordingLocked ? (
                  <IconMingcuteLockFill className="text-negative-300 size-full" />
               ) : (
                  <IconMingcuteUnlockFill className="text-primary-500 size-full" />
               )}
            </div>
         )}
         <div className="fixed size-5" style={{ right: "min(calc(100vw - 3rem),200px)" }} ref={cancelRef}></div>
      </div>
   );
}
