import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";

export default function CameraPreview() {
   const videoRef = useRef<HTMLVideoElement | null>(null);
   const streamRef = useRef<MediaStream | null>(null);
   const [isFullscreen, setIsFullscreen] = useState(false);

   const setVideoRef = useCallback((video: HTMLVideoElement | null) => {
      videoRef.current = video;

      if (video) video.srcObject = streamRef.current;
   }, []);

   useEffect(() => {
      let unmounted = false;

      async function startCamera() {
         const cameraStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: "environment", zoom: true },
         });

         if (unmounted) {
            cameraStream.getTracks().forEach((track) => track.stop());
            return;
         }

         streamRef.current = cameraStream;

         if (videoRef.current) videoRef.current.srcObject = cameraStream;
      }

      void startCamera();

      return () => {
         unmounted = true;
         streamRef.current?.getTracks().forEach((track) => track.stop());
         streamRef.current = null;

         if (videoRef.current) videoRef.current.srcObject = null;
      };
   }, []);

   async function handleVideoClick() {
      if (isFullscreen) {
         const track = streamRef.current?.getVideoTracks()[0];
         const torchStatus = track?.getSettings().torch;
         console.log(track?.getCapabilities());
         await streamRef.current?.getVideoTracks()[0].applyConstraints({ advanced: [{ torch: !torchStatus, zoom: 2 }] });
      }

      const showFullscreenPreview = () => setIsFullscreen(true);

      if (!document.startViewTransition) {
         showFullscreenPreview();
         return;
      }

      document.startViewTransition(() => flushSync(showFullscreenPreview));
   }

   const preview = (
      <button
         type="button"
         aria-label={isFullscreen ? "Exit fullscreen camera preview" : "Open fullscreen camera preview"}
         style={{ viewTransitionName: "camera-preview" }}
         className={clsx("overflow-hidden", !isFullscreen ? "row-span-2 h-full w-full rounded-lg" : "fixed inset-0 z-1000 h-dvh w-screen bg-black")}
         onClick={handleVideoClick}
      >
         <video ref={setVideoRef} autoPlay playsInline className="size-full object-cover" />
      </button>
   );

   if (!isFullscreen) return preview;

   return (
      <>
         <div className="row-span-2 h-full w-full" />
         {createPortal(preview, document.body)}
      </>
   );
}
