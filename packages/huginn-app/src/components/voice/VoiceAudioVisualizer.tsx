import { remap } from "@huginn/shared";
import { hexToRgbObject, useTheme } from "@stores/themeStore";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";

export default function VoiceAudioVisualizer(props: { track?: MediaStreamTrack }) {
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const containerRef = useRef<HTMLDivElement>(null);
   const frameCallbackHandleRef = useRef<number | null>(null);
   const currentTheme = useTheme();
   const [hasAnyAudio, setHasAnyAudio] = useState(false);
   const _hasAnyAudio = useRef(false);
   const srcObject = useMemo(() => (props.track ? new MediaStream([props.track]) : undefined), [props.track]);

   useEffect(() => {
      _hasAnyAudio.current = hasAnyAudio;
   }, [hasAnyAudio]);

   useEffect(() => {
      if (!srcObject || !canvasRef.current) {
         return;
      }

      const canvasContext = canvasRef.current.getContext("2d");

      if (!canvasContext) {
         return;
      }

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.smoothingTimeConstant = 0.85;
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(srcObject as MediaStream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      function draw() {
         if (!canvasRef.current || !canvasContext || !containerRef.current) {
            return;
         }

         canvasRef.current.width = containerRef.current.clientWidth - 20;
         canvasRef.current.height = containerRef.current.clientHeight;

         const width = canvasRef.current.width;
         const height = canvasRef.current.height;

         frameCallbackHandleRef.current = requestAnimationFrame(draw);
         analyser.getByteFrequencyData(dataArray);

         const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
         if (average === 0 && _hasAnyAudio.current) {
            setHasAnyAudio(false);
         } else if (average > 0 && !_hasAnyAudio.current) {
            setHasAnyAudio(true);
         }

         canvasContext.clearRect(0, 0, width, height);

         const barWidth = (width / bufferLength) * 2.15;
         let barHeight = 0;
         let x = 0;

         for (let i = 0; i < bufferLength; i++) {
            // Make bar height proportional to canvas height
            barHeight = (dataArray[i] / 255) * (height / 2.5); // Normalize to half canvas height
            const color = hexToRgbObject(currentTheme.theme["primary-700"]);
            canvasContext.fillStyle = `rgb(${remap(dataArray[i], 0, 255, 128, color?.r)} ${remap(dataArray[i], 0, 255, 128, color?.g)} ${remap(dataArray[i], 0, 255, 128, color?.b)})`;

            // Draw upper bar (mirrored)
            canvasContext.fillRect(
               x,
               height / 2 - barHeight, // Start from middle, go up
               barWidth,
               barHeight,
            );

            // Draw lower bar
            canvasContext.fillRect(
               x,
               height / 2, // Start from middle, go down
               barWidth,
               barHeight,
            );

            x += barWidth + 1;
         }
      }

      draw();

      return () => {
         source.disconnect();
         analyser.disconnect();
         audioContext.close();

         if (frameCallbackHandleRef.current !== null) {
            cancelAnimationFrame(frameCallbackHandleRef.current);
            frameCallbackHandleRef.current = null;
         }
      };
   }, [currentTheme.theme, srcObject]);

   return (
      <div ref={containerRef} className="relative flex h-full w-full items-center justify-center">
         <div
            className={clsx(
               "text-text absolute flex items-center justify-center italic transition-opacity",
               !hasAnyAudio ? "opacity-100" : "opacity-0",
            )}
         >
            No audio is playing
         </div>
         <canvas ref={canvasRef} />
      </div>
   );
}
