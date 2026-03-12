import { interpolateColor } from "@huginn/shared";
import { useTheme } from "@stores/themeStore";
import * as blobs2Animate from "blobs/v2/animate";
import { useEffect, useEffectEvent, useRef, useState } from "react";

const animation = blobs2Animate.canvasPath();

const blobSize = 700;

export default function StartBackground() {
   const { theme } = useTheme();
   const canvas = useRef<HTMLCanvasElement | null>(null);
   const [canvasSize, setCanvasSize] = useState(window.innerWidth);
   const [isResizing, setIsResizing] = useState(false);
   const animationStartRef = useRef<number>(Date.now());

   function loopAnimation(duration: number = 5000) {
      const seed = Math.random();
      animation.transition({
         blobOptions: { seed: seed, extraPoints: 10, randomness: 3, size: blobSize },
         canvasOptions: { offsetX: canvasSize / 2 - blobSize / 2, offsetY: canvasSize / 2 - blobSize / 2 },
         duration: duration,
         timingFunction: "ease",
         callback: loopAnimation,
      });
   }

   useEffect(() => {
      function handleResize() {
         setIsResizing(true);
         setCanvasSize(window.innerWidth);
      }

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
   }, []);

   useEffect(() => {
      loopAnimation(0);
   }, []);

   const renderAnimation = useEffectEvent(() => {
      const context = canvas.current?.getContext("2d");
      if (!context || isResizing) return;

      const cycle = 10000;
      const elapsedMs = (Date.now() - animationStartRef.current) % cycle;
      const colorProgress = elapsedMs / cycle;

      // Create color animation between theme colors
      const colors = [theme["primary-700"], theme["primary-800"], theme["primary-700"]];

      let fillColor1 = theme["primary-900"];
      let fillColor2 = theme["primary-700"];
      if (colors.length > 1) {
         const segment = 1 / (colors.length - 1);
         const segmentIndex = Math.floor(colorProgress / segment);
         const nextSegmentIndex = (segmentIndex + 1) % colors.length;
         const segmentProgress = (colorProgress - segmentIndex * segment) / segment;
         fillColor2 = interpolateColor(colors[segmentIndex], colors[nextSegmentIndex], segmentProgress);
         // fillColor2 = interpolateColor(colors[(segmentIndex + 1) % colors.length], colors[(segmentIndex + 2) % colors.length], segmentProgress);
      }

      context.clearRect(0, 0, canvasSize, canvasSize);

      const gradient = context.createRadialGradient(canvasSize / 2, canvasSize / 2, 0, canvasSize / 2, canvasSize / 2, canvasSize / 2);
      gradient.addColorStop(0, fillColor1);
      gradient.addColorStop(1, fillColor2);
      context.fillStyle = gradient;

      context.fill(animation.renderFrame());
      requestAnimationFrame(renderAnimation);
   });

   function clearCanvas() {
      const context = canvas.current?.getContext("2d");
      if (!context) return;

      context.clearRect(0, 0, canvasSize, canvasSize);
   }

   useEffect(() => {
      clearCanvas();
      const timeout = setTimeout(() => {
         setIsResizing(false);
         loopAnimation(0);
      }, 100);
      return () => {
         clearTimeout(timeout);
      };
   }, [canvasSize]);

   useEffect(() => {
      const animationFrame = requestAnimationFrame(renderAnimation);

      return () => {
         cancelAnimationFrame(animationFrame);
      };
   }, [canvasSize, blobSize, theme, isResizing]);

   return (
      <div className="fixed flex h-full w-full items-center justify-center" style={{ viewTransitionName: "start-background" }}>
         <canvas ref={canvas} width={canvasSize} height={canvasSize} className="absolute" />
      </div>
   );
}
