import { interpolateColor } from "@huginn/shared";
import { useTheme } from "@stores/themeStore";
import { useMatch } from "@tanstack/react-router";
import * as blobs2Animate from "blobs/v2/animate";
import { useCallback, useEffect, useRef } from "react";

const animation = blobs2Animate.canvasPath();

const blobSize = 700;

export default function StartBackground() {
   const { theme } = useTheme();
   const startMatch = useMatch({ from: "/_app/_start", shouldThrow: false });
   const isActive = !!startMatch;
   const canvasRef = useRef<HTMLCanvasElement | null>(null);
   const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
   const rafIdRef = useRef<number>(0);
   const animationStartRef = useRef<number>(Date.now());
   const canvasSizeRef = useRef({ width: window.innerWidth, height: window.innerHeight });
   const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
   const themeRef = useRef(theme);
   themeRef.current = theme;

   const loopAnimation = useCallback((duration: number = 5000) => {
      const seed = Math.random();
      const { width, height } = canvasSizeRef.current;
      animation.transition({
         blobOptions: { seed, extraPoints: 10, randomness: 3, size: blobSize },
         canvasOptions: {
            offsetX: width / 2 - blobSize / 2,
            offsetY: height / 2 - blobSize / 2,
         },
         duration,
         timingFunction: "ease",
         callback: loopAnimation,
      });
   }, []);

   const renderFrame = useCallback(() => {
      const ctx = ctxRef.current;
      if (!ctx) {
         rafIdRef.current = requestAnimationFrame(renderFrame);
         return;
      }

      const { width, height } = canvasSizeRef.current;
      const t = themeRef.current;
      const cycle = 10000;
      const elapsedMs = (Date.now() - animationStartRef.current) % cycle;
      const colorProgress = elapsedMs / cycle;

      const color1 = t["primary-700"];
      const color2 = t["primary-800"];

      // Interpolate between [color1, color2, color1] based on progress
      const segment = 0.5;
      const segmentIndex = Math.min(Math.floor(colorProgress / segment), 1);
      const segmentProgress = (colorProgress - segmentIndex * segment) / segment;
      const from = segmentIndex === 0 ? color1 : color2;
      const to = segmentIndex === 0 ? color2 : color1;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) / 2);
      gradient.addColorStop(0, t["primary-900"]);
      gradient.addColorStop(1, interpolateColor(from, to, segmentProgress));
      ctx.fillStyle = gradient;

      ctx.fill(animation.renderFrame());
      rafIdRef.current = requestAnimationFrame(renderFrame);
   }, []);

   // Initialize context and start/stop animation based on login state
   useEffect(() => {
      const cvs = canvasRef.current;
      if (!cvs) return;

      ctxRef.current = cvs.getContext("2d");

      const { width, height } = canvasSizeRef.current;
      cvs.width = width;
      cvs.height = height;

      if (isActive) {
         loopAnimation(0);
         rafIdRef.current = requestAnimationFrame(renderFrame);
      }

      return () => {
         cancelAnimationFrame(rafIdRef.current);
      };
   }, [loopAnimation, renderFrame, isActive]);

   // Handle resize without triggering React re-renders
   useEffect(() => {
      if (!isActive) return;

      function handleResize() {
         if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
         cancelAnimationFrame(rafIdRef.current);

         const width = window.innerWidth;
         const height = window.innerHeight;
         canvasSizeRef.current = { width, height };

         const cvs = canvasRef.current;
         if (cvs) {
            cvs.width = width;
            cvs.height = height;
         }

         ctxRef.current?.clearRect(0, 0, width, height);

         resizeTimerRef.current = setTimeout(() => {
            loopAnimation(0);
            rafIdRef.current = requestAnimationFrame(renderFrame);
         }, 100);
      }

      window.addEventListener("resize", handleResize);
      return () => {
         window.removeEventListener("resize", handleResize);
         if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      };
   }, [loopAnimation, renderFrame, isActive]);

   return (
      <div className="fixed flex h-full w-full items-center justify-center" style={{ viewTransitionName: "start-background" }}>
         <canvas ref={canvasRef} width={canvasSizeRef.current.width} height={canvasSizeRef.current.height} className="absolute" />
      </div>
   );
}
