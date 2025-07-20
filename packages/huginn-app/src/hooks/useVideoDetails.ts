import { type RefObject, useEffect, useRef, useState } from "react";

export function useVideoDetails(videoRef: RefObject<HTMLVideoElement | null>, srcObject?: MediaProvider) {
   const frameCallbackHandleRef = useRef<number | null>(null);
   const [estimateFps, setEstimateFps] = useState(0);
   const [height, setHeight] = useState(0);

   useEffect(() => {
      const video = videoRef.current;

      if (!video) {
         return;
      }

      let frames = 0;
      let start = performance.now();

      function countFrames(now: DOMHighResTimeStamp, _metadata: VideoFrameCallbackMetadata) {
         frames++;
         const elapsed = (now - start) / 1000;
         if (elapsed >= 1.0) {
            setEstimateFps(frames);
            frames = 0;
            start = now;
         }
         frameCallbackHandleRef.current = video?.requestVideoFrameCallback(countFrames) ?? null;
      }

      function startCounting() {
         frames = 0;
         start = performance.now();
         frameCallbackHandleRef.current = video?.requestVideoFrameCallback(countFrames) ?? null;
      }

      function stopCounting() {
         if (frameCallbackHandleRef.current !== null) {
            video?.cancelVideoFrameCallback(frameCallbackHandleRef.current);
            frameCallbackHandleRef.current = null;
         }
      }

      function handleLoadedMetadata() {
         stopCounting();
         startCounting();
         // Set initial height when video loads
         setHeight(video?.videoHeight ?? 0);
      };

      function handleResize() {
         setHeight(video?.videoHeight ?? 0);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('resize', handleResize);

      if (video.readyState >= 1) {
         setHeight(video.videoHeight);
         if (video.readyState >= 3) {
            handleLoadedMetadata();
         }
      }

      return () => {
         stopCounting();
         video.removeEventListener('loadedmetadata', handleLoadedMetadata);
         video.removeEventListener('resize', handleResize);
      };
   }, [srcObject, videoRef]);

   return { estimateFps, height };
}
