import { clamp } from "@huginnjs/shared";
import { type CSSProperties, type MouseEvent, type PointerEvent, type RefObject, useEffect, useEffectEvent, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const SIDE_PADDING = 64;
const DRAG_THRESHOLD = 6;
type Point = { x: number; y: number };

/** Picture gestures belong to the viewer; controls and native fullscreen keep their own input. */
export function useMediaViewerGestures(options: {
   stageRef: RefObject<HTMLDivElement | null>;
   mediaKey: string;
   isVideo: boolean;
   isLoaded: boolean;
   width: number;
   height: number;
   viewportWidth: number;
   viewportHeight: number;
}) {
   const [framing, setFraming] = useState({ scale: MIN_SCALE, x: 0, y: 0 });
   const framingRef = useRef(framing);
   const [isDragging, setDragging] = useState(false);
   const [isFullscreen, setFullscreen] = useState(false);
   const pointers = useRef(new Map<number, Point>());
   const drag = useRef<{ start: Point; offset: Point; pans: boolean } | null>(null);
   const pinch = useRef<{ distance: number; scale: number } | null>(null);
   const suppressClick = useRef(false);

   function updateFraming(scale: number, offset: Point = framingRef.current) {
      scale = clamp(scale, MIN_SCALE, MAX_SCALE);
      const overflowX = (options.width * scale - options.viewportWidth) / 2;
      const overflowY = (options.height * scale - options.viewportHeight) / 2;
      const maxX = scale > MIN_SCALE && overflowX > 0 ? overflowX + SIDE_PADDING : 0;
      const maxY = scale > MIN_SCALE && overflowY > 0 ? overflowY + SIDE_PADDING : 0;
      const next = { scale, x: clamp(offset.x, -maxX, maxX), y: clamp(offset.y, -maxY, maxY) };
      framingRef.current = next;
      setFraming(next);
   }

   function resetPointers() {
      pointers.current.clear();
      drag.current = null;
      pinch.current = null;
      setDragging(false);
   }

   function ignoresTarget(target: EventTarget | null) {
      return Boolean(document.fullscreenElement || (target instanceof Element && target.closest("[data-media-controls]")));
   }

   const wheel = useEffectEvent((event: WheelEvent) => {
      if (ignoresTarget(event.target) || !options.isLoaded) return;
      event.preventDefault();
      updateFraming(framingRef.current.scale * (event.deltaY < 0 ? 1.1 : 0.9));
   });

   useEffect(() => {
      const stage = options.stageRef.current;
      stage?.addEventListener("wheel", wheel, { passive: false });
      return () => stage?.removeEventListener("wheel", wheel);
   }, [options.stageRef]);

   useEffect(() => {
      function fullscreenChanged() {
         setFullscreen(Boolean(document.fullscreenElement));
         resetPointers();
         suppressClick.current = false;
      }
      document.addEventListener("fullscreenchange", fullscreenChanged);
      return () => document.removeEventListener("fullscreenchange", fullscreenChanged);
   }, []);

   useEffect(() => {
      updateFraming(MIN_SCALE, { x: 0, y: 0 });
      resetPointers();
      suppressClick.current = false;
   }, [options.mediaKey]);

   useEffect(() => {
      if (document.fullscreenElement) return;
      updateFraming(framingRef.current.scale);
      resetPointers();
   }, [options.width, options.height, options.viewportWidth, options.viewportHeight, isFullscreen]);

   function beginDrag(point: Point, pans: boolean) {
      drag.current = { start: point, offset: { x: framingRef.current.x, y: framingRef.current.y }, pans };
      setDragging(pans);
   }

   function onPointerDown(event: PointerEvent<HTMLDivElement>) {
      // A fresh intentional interaction must never inherit a previous gesture's click guard.
      if (pointers.current.size === 0) suppressClick.current = false;
      if (ignoresTarget(event.target) || !options.isLoaded || !(event.target instanceof Element) || !event.target.closest("[data-media-picture]"))
         return;
      const touch = event.pointerType === "touch";
      const allowedButton = event.button === 1 || (event.button === 0 && (!options.isVideo || event.ctrlKey));
      if (!touch && event.button !== 0 && !(event.button === 1 && framingRef.current.scale > MIN_SCALE)) return;
      const pans = framingRef.current.scale > MIN_SCALE && (touch || allowedButton);
      const point = { x: event.clientX, y: event.clientY };
      pointers.current.set(event.pointerId, point);
      // Keep the original picture as the click target even if the pointer leaves its bounds.
      event.target.setPointerCapture?.(event.pointerId);
      if (!touch && pans) event.preventDefault(); // Includes middle-button autoscroll.
      if (pointers.current.size === 2) {
         const [a, b] = [...pointers.current.values()];
         pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: framingRef.current.scale };
         drag.current = null;
         suppressClick.current = true;
         setDragging(false);
      } else {
         beginDrag(point, pans);
      }
   }

   function onPointerMove(event: PointerEvent<HTMLDivElement>) {
      if (ignoresTarget(event.target) || !pointers.current.has(event.pointerId)) return;
      const point = { x: event.clientX, y: event.clientY };
      pointers.current.set(event.pointerId, point);
      if (pinch.current && pointers.current.size === 2) {
         const [a, b] = [...pointers.current.values()];
         if (pinch.current.distance > 0) updateFraming((pinch.current.scale * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.current.distance);
      } else if (drag.current) {
         const dx = point.x - drag.current.start.x;
         const dy = point.y - drag.current.start.y;
         if (Math.hypot(dx, dy) > DRAG_THRESHOLD) suppressClick.current = true;
         if (suppressClick.current && drag.current.pans)
            updateFraming(framingRef.current.scale, { x: drag.current.offset.x + dx, y: drag.current.offset.y + dy });
      }
   }

   function onPointerUp(event: PointerEvent<HTMLDivElement>) {
      if (!pointers.current.delete(event.pointerId)) return;
      pinch.current = null;
      drag.current = null;
      setDragging(false);
      if (pointers.current.size === 1) beginDrag([...pointers.current.values()][0], framingRef.current.scale > MIN_SCALE);
   }

   function onClickCapture(event: MouseEvent<HTMLDivElement>) {
      if (ignoresTarget(event.target) || !suppressClick.current) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick.current = false;
   }

   return {
      scale: framing.scale,
      isDragging,
      isFullscreen,
      pictureStyle: { transform: `translate3d(${framing.x}px, ${framing.y}px, 0) scale(${framing.scale})` } satisfies CSSProperties,
      toggleZoom: () => options.isLoaded && updateFraming(framingRef.current.scale > MIN_SCALE ? MIN_SCALE : 2),
      stageHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onLostPointerCapture: onPointerUp, onClickCapture },
      // Pointer events handle touch and mouse together. Fullscreen uses normal browser input.
      stageStyle: { touchAction: isFullscreen ? "auto" : "none" } satisfies CSSProperties,
   };
}
