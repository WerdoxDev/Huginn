import { useMainViewTransitionState } from "@hooks/useMainViewTransitionState";
import { useTheme } from "@stores/themeStore";
import * as blobs2Animate from "blobs/v2/animate";
import { useEffect, useRef, useState } from "react";
import { useViewTransitionState } from "react-router";

const animation = blobs2Animate.canvasPath();

const blobSize = 700;
// const blobFullSize = 1000

export default function StartBackgroundSvg(props: { state: number }) {
   const { theme } = useTheme();
   const { isMainTransitioning, isStartTransitioning } = useMainViewTransitionState();
   const canvas = useRef<HTMLCanvasElement | null>(null);
   const [canvasSize, setCanvasSize] = useState(window.innerWidth);

   const isTransitioning = useViewTransitionState("/channels/*");

   useEffect(() => {
      console.log(isTransitioning);
   }, [isTransitioning]);

   function loopAnimation(duration: number = 5000) {
      animation.transition({
         blobOptions: { seed: Math.random(), extraPoints: 10, randomness: 3, size: blobSize },
         canvasOptions: { offsetX: canvasSize / 2 - blobSize / 2, offsetY: canvasSize / 2 - blobSize / 2 },
         duration: duration,
         timingFunction: "ease",
         callback: loopAnimation,
      });
   }

   useEffect(() => {
      function handleResize() {
         setCanvasSize(window.innerWidth);
      }

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
   }, []);

   useEffect(() => {
      if (props.state === 2) {
         const size = window.innerWidth * 2;
         animation.transition({
            blobOptions: { seed: Math.random(), extraPoints: 0, randomness: 0, size: size },
            canvasOptions: { offsetX: canvasSize / 2 - size / 2, offsetY: canvasSize / 2 - size / 2 },
            duration: 500,
            timingFunction: "ease",
         });
      }
      if (props.state === 0) {
         loopAnimation(1000);
      }
   }, [props.state]);

   useEffect(() => {
      function renderAnimation() {
         const context = canvas.current?.getContext("2d");
         if (!context) return;

         context.clearRect(0, 0, canvasSize, canvasSize);
         context.fillStyle = theme["primary-700"];
         context.fill(animation.renderFrame());
         requestAnimationFrame(renderAnimation);
      }

      const animationFrame = requestAnimationFrame(renderAnimation);

      // loopAnimation(0);

      return () => {
         cancelAnimationFrame(animationFrame);
      };
   }, [canvasSize, blobSize, theme]);

   return (
      <div
         className="flex h-full w-full items-center justify-center"
         style={isMainTransitioning ? { viewTransitionName: "start-surface" } : undefined}
      >
         <canvas ref={canvas} width={canvasSize} height={canvasSize} />
      </div>
   );
}
