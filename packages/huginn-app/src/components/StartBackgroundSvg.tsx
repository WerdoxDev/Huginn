import { useMainViewTransitionState } from "@hooks/useMainViewTransitionState";
import { useTheme } from "@stores/themeStore";
import * as blobs2Animate from "blobs/v2/animate";
import { time } from "motion";
import { useEffect, useEffectEvent, useRef, useState } from "react";

const animation = blobs2Animate.canvasPath();

const blobSize = 700;
// const blobFullSize = 1000

export default function StartBackgroundSvg(props: { state: number }) {
   const { theme } = useTheme();
   const { isMainTransitioning } = useMainViewTransitionState();
   const canvas = useRef<HTMLCanvasElement | null>(null);
   const [canvasSize, setCanvasSize] = useState(window.innerWidth);
   const [isResizing, setIsResizing] = useState(false);

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
         setIsResizing(true);
         setCanvasSize(window.innerWidth);
      }

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
   }, []);

   useEffect(() => {
      // if (props.state === 2) {
      //    const size = window.innerWidth * 2;
      //    animation.transition({
      //       blobOptions: { seed: Math.random(), extraPoints: 0, randomness: 0, size: size },
      //       canvasOptions: { offsetX: canvasSize / 2 - size / 2, offsetY: canvasSize / 2 - size / 2 },
      //       duration: 750,
      //       timingFunction: "ease",
      //    });
      // }
      // if (props.state === 0) {
      //    loopAnimation(500);
      // }
      loopAnimation(0);
   }, []);

   const renderAnimation = useEffectEvent(() => {
      const context = canvas.current?.getContext("2d");
      if (!context || isResizing) return;

      context.clearRect(0, 0, canvasSize, canvasSize);
      context.fillStyle = theme["primary-700"];
      context.fill(animation.renderFrame());
      requestAnimationFrame(renderAnimation);
   });

   function clearCanvas() {
      const context = canvas.current?.getContext("2d");
      if (!context) return;

      console.log("CLEARING");

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
         <canvas ref={canvas} width={canvasSize} height={canvasSize} />
      </div>
   );
}
