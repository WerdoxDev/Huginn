import { VoiceInputDevice } from "@lib/voice/voice-input-device";
import { useStorage } from "@stores/storageStore";
import { useEffect, useRef, useState, type PointerEvent } from "react";

import HuginnButton from "./HuginnButton";

export default function MessageSendButton(props: { onSubmit: () => void; content: string }) {
   const [isRecording, setIsRecording] = useState(false);
   const timeoutRef = useRef<number | undefined>(undefined);
   const releaseInputRef = useRef<(() => void) | null>(null);
   const recorderRef = useRef<MediaRecorder | null>(null);
   const settings = useStorage("settings");

   function handleClickStart(e: PointerEvent<HTMLButtonElement>) {
      if (e.button !== 0) return;

      e.currentTarget.setPointerCapture(e.pointerId);

      clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
         setIsRecording(true);
      }, 500);
   }

   function handleClickEnd(e: PointerEvent<HTMLButtonElement>) {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
         e.currentTarget.releasePointerCapture(e.pointerId);
      }

      clearTimeout(timeoutRef.current);
      setIsRecording(false);
      recorderRef.current?.stop();
   }

   async function startRecording() {
      releaseInputRef.current = VoiceInputDevice.acquire();

      const stream = await VoiceInputDevice.getStream(settings.inputDeviceId, settings.inputVolume, settings.noiseSuppression);
      const track = stream.getAudioTracks()[0].clone();
      const recorder = new MediaRecorder(new MediaStream([track]), { mimeType: "audio/mp4" });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
         if (event.data.size > 0) {
            const blob = new Blob([event.data], { type: "audio/mp4" });
            const file = new File([blob], "voice-input.mp4", { type: "audio/mp4" });
            console.log(file);
         }
      };

      recorder.onstop = () => {
         track.stop();
         releaseInputRef.current?.();
      };

      recorder.start();
   }

   useEffect(() => {
      if (isRecording) {
         void startRecording();
      } else {
         releaseInputRef.current?.();
      }
   }, [isRecording]);

   return (
      <HuginnButton
         color={isRecording ? "positive" : "primary"}
         className="flex size-10 cursor-pointer items-center justify-center rounded-full! p-2"
         type="button"
         onClick={() => props.onSubmit()}
         onPointerDown={handleClickStart}
         onPointerUp={handleClickEnd}
         onPointerCancel={handleClickEnd}
         data-keyboard-no-close
      >
         {props.content ? <IconLetsIconsSendHorFill className="text-text size-full" /> : <IconMingcuteMicFill className="text-text size-full" />}
      </HuginnButton>
   );
}
