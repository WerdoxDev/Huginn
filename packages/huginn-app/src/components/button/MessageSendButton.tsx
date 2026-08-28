import { VoiceInputDevice } from "@lib/voice/voice-input-device";
import { useChannelStore } from "@stores/channelStore";
import { useStorage } from "@stores/storageStore";
import clsx from "clsx";
import { button } from "motion/react-m";
import { useEffect, useRef, useState, type PointerEvent } from "react";

import HuginnButton from "./HuginnButton";

export default function MessageSendButton(props: { onSubmit: () => void; content: string }) {
   // const [isRecording, setIsRecording] = useState(false);
   const timeoutRef = useRef<number | undefined>(undefined);
   const releaseInputRef = useRef<(() => void) | null>(null);
   const recorderRef = useRef<MediaRecorder | null>(null);
   const settings = useStorage("settings");
   const lockRef = useRef<HTMLDivElement | null>(null);
   const buttonRef = useRef<HTMLButtonElement | null>(null);
   const cancelRef = useRef<HTMLDivElement | null>(null);
   const [isCancelling, setIsCancelling] = useState(false);
   const isCancelled = useRef(false);
   const { isRecordingVoice, setIsRecordingVoice, isVoiceRecordingLocked, setIsVoiceRecordingLocked } = useChannelStore();

   function handleClickStart(e: PointerEvent<HTMLButtonElement>) {
      if (e.button !== 0) return;

      e.currentTarget.setPointerCapture(e.pointerId);

      clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
         setIsRecordingVoice(true);
      }, 250);
   }

   function handleClickEnd(e: PointerEvent<HTMLButtonElement>) {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
         e.currentTarget.releasePointerCapture(e.pointerId);
      }

      if (isVoiceRecordingLocked) return;
      if (isCancelling) isCancelled.current = true;
      stopRecording();
   }

   function handleClickMove(e: PointerEvent<HTMLButtonElement>) {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      if (!buttonRef.current || !lockRef.current || !cancelRef.current) return;
      if (isVoiceRecordingLocked) return;

      const lockRect = lockRef.current.getBoundingClientRect();
      const cancelRect = cancelRef.current.getBoundingClientRect();

      if (lockRect.bottom < e.clientY) {
         setIsVoiceRecordingLocked(false);
      } else {
         setIsVoiceRecordingLocked(true);
      }

      if (cancelRect.right > e.clientX) {
         setIsCancelling(true);
      } else {
         setIsCancelling(false);
      }
   }

   async function startRecording() {
      releaseInputRef.current = VoiceInputDevice.acquire();

      const stream = await VoiceInputDevice.getStream(settings.inputDeviceId, settings.inputVolume, settings.noiseSuppression);
      const track = stream.getAudioTracks()[0].clone();
      const recorder = new MediaRecorder(new MediaStream([track]), { mimeType: "audio/mp4" });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
         if (isCancelled.current) return;
         if (event.data.size > 0) {
            const blob = new Blob([event.data], { type: "audio/mp4" });
            const file = new File([blob], "voice-input.mp4", { type: "audio/mp4" });
            console.log(file);
         }
      };

      recorder.onstop = () => {
         track.stop();
         releaseInputRef.current?.();
         console.log("FALSE");
         isCancelled.current = false;
      };

      recorder.start();
   }

   function stopRecording() {
      clearTimeout(timeoutRef.current);
      setIsVoiceRecordingLocked(false);
      setIsRecordingVoice(false);
      setIsCancelling(false);
      recorderRef.current?.stop();
      console.log("STOP");
   }

   function handleClick() {
      if (isRecordingVoice && isVoiceRecordingLocked) {
         stopRecording();
      } else {
         props.onSubmit();
      }
   }

   useEffect(() => {
      if (isRecordingVoice) {
         void startRecording();
      } else {
         releaseInputRef.current?.();
         if (!recorderRef.current || recorderRef.current?.state === "recording") {
            isCancelled.current = true;
            stopRecording();
         }
      }
   }, [isRecordingVoice]);

   return (
      <div className="relative flex items-center justify-center">
         <HuginnButton
            ref={buttonRef}
            color={isCancelling ? "negative" : "primary"}
            className={clsx(
               "flex size-10 cursor-pointer items-center justify-center rounded-full! p-2 transition-all!",
               isRecordingVoice && "scale-125 animate-pulse",
            )}
            type="button"
            onClick={handleClick}
            onPointerDown={handleClickStart}
            onPointerUp={handleClickEnd}
            onPointerCancel={handleClickEnd}
            onPointerMove={handleClickMove}
            data-keyboard-no-close
         >
            {props.content || isVoiceRecordingLocked ? (
               <IconLetsIconsSendHorFill className="text-text size-full" />
            ) : (
               <IconMingcuteMicFill className="text-text size-full" />
            )}
         </HuginnButton>
         {isRecordingVoice && (
            <div className="bg-surface-alt absolute -top-32 z-20 size-12 rounded-full p-2" ref={lockRef}>
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
