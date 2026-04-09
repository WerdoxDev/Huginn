import HuginnButton from "@components/button/HuginnButton";
import ModalCloseButton from "@components/button/ModalCloseButton";
import { Transition } from "@headlessui/react";
import { useOpen } from "@hooks/useOpen";
import { clamp, constrainImageSize } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState, type TouchEvent, type WheelEvent, type MouseEvent, type Touch } from "react";

import LoadingIcon from "../LoadingIcon";
import HuginnDialogPanel from "./HuginnDialogPanel";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_SIDE_PADDING = 64;

function getTouchDistance(touchA: Touch, touchB: Touch) {
   return Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY);
}

export default function MagnifiedImageModal() {
   const { magnifiedImage: modal, updateModals } = useModals();
   const [isLoaded, setIsLoaded] = useState(false);
   const [scale, setScale] = useState(MIN_SCALE);
   const [offset, setOffset] = useState({ x: 0, y: 0 });
   const [isDragging, setIsDragging] = useState(false);
   const imgRef = useRef<HTMLImageElement>(null);
   const stageRef = useRef<HTMLDivElement>(null);
   const dragStartRef = useRef<{ x: number; y: number } | null>(null);
   const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
   const dragMovedRef = useRef(false);
   const pinchStartRef = useRef<{ distance: number; scale: number } | null>(null);
   const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
   const { openUrl } = useOpen();

   const viewportWidth = stageSize.width || window.innerWidth;
   const viewportHeight = stageSize.height || window.innerHeight;

   const dimensions = useMemo(() => {
      const horizontalPadding = viewportWidth < 1024 ? 24 : 80;
      const verticalPadding = viewportWidth < 1024 ? 120 : 100;
      return constrainImageSize(modal.width, modal.height, viewportWidth - horizontalPadding, viewportHeight - verticalPadding);
   }, [modal.width, modal.height, viewportHeight, viewportWidth]);

   function close() {
      updateModals({ magnifiedImage: { isOpen: false } });
   }

   function clampOffset(nextScale: number, nextOffset: { x: number; y: number }) {
      const overflowX = (dimensions.width * nextScale - viewportWidth) / 2;
      const overflowY = (dimensions.height * nextScale - viewportHeight) / 2;
      const maxX = overflowX > 0 ? overflowX + ZOOM_SIDE_PADDING : 0;
      const maxY = overflowY > 0 ? overflowY + ZOOM_SIDE_PADDING : 0;

      return {
         x: clamp(nextOffset.x, -maxX, maxX),
         y: clamp(nextOffset.y, -maxY, maxY),
      };
   }

   function updateZoom(nextScale: number, nextOffset = offset) {
      if (!isLoaded) return;

      const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
      const normalizedOffset = clampedScale === MIN_SCALE ? { x: 0, y: 0 } : nextOffset;
      const clampedOffset = clampOffset(clampedScale, normalizedOffset);

      setScale(clampedScale);
      setOffset(clampedOffset);
   }

   function stopDragging() {
      setIsDragging(false);
      dragStartRef.current = null;
      pointerStartRef.current = null;
   }

   function handleMouseDown(event: MouseEvent<HTMLDivElement>) {
      if (scale === MIN_SCALE) {
         return;
      }

      event.preventDefault();
      dragMovedRef.current = false;
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
      setIsDragging(true);
      dragStartRef.current = {
         x: event.clientX - offset.x,
         y: event.clientY - offset.y,
      };
   }

   function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
      if (!isDragging || !dragStartRef.current) {
         return;
      }

      event.preventDefault();
      if (pointerStartRef.current && Math.hypot(event.clientX - pointerStartRef.current.x, event.clientY - pointerStartRef.current.y) > 4) {
         dragMovedRef.current = true;
      }
      const nextOffset = {
         x: event.clientX - dragStartRef.current.x,
         y: event.clientY - dragStartRef.current.y,
      };
      setOffset(clampOffset(scale, nextOffset));
   }

   function handleWheel(event: WheelEvent<HTMLDivElement>) {
      // event.preventDefault();
      const zoomStep = event.deltaY < 0 ? 1.1 : 0.9;
      updateZoom(scale * zoomStep);
   }

   function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
      if (event.touches.length === 2) {
         dragMovedRef.current = true;
         pinchStartRef.current = {
            distance: getTouchDistance(event.touches[0], event.touches[1]),
            scale,
         };
         stopDragging();
         return;
      }

      if (event.touches.length === 1 && scale > MIN_SCALE) {
         dragMovedRef.current = false;
         pointerStartRef.current = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
         };
         setIsDragging(true);
         dragStartRef.current = {
            x: event.touches[0].clientX - offset.x,
            y: event.touches[0].clientY - offset.y,
         };
      }
   }

   function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
      if (event.touches.length === 2 && pinchStartRef.current) {
         event.preventDefault();
         const distance = getTouchDistance(event.touches[0], event.touches[1]);
         const pinchRatio = distance / pinchStartRef.current.distance;
         updateZoom(pinchStartRef.current.scale * pinchRatio);
         return;
      }

      if (event.touches.length === 1 && isDragging && dragStartRef.current) {
         // event.preventDefault();
         if (
            pointerStartRef.current &&
            Math.hypot(event.touches[0].clientX - pointerStartRef.current.x, event.touches[0].clientY - pointerStartRef.current.y) > 6
         ) {
            dragMovedRef.current = true;
         }
         const nextOffset = {
            x: event.touches[0].clientX - dragStartRef.current.x,
            y: event.touches[0].clientY - dragStartRef.current.y,
         };
         setOffset(clampOffset(scale, nextOffset));
      }
   }

   function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
      if (event.touches.length < 2) {
         pinchStartRef.current = null;
      }

      if (event.touches.length === 0) {
         stopDragging();
      }
   }

   function handleImageClick(event: MouseEvent<HTMLDivElement>) {
      event.stopPropagation();
      if (dragMovedRef.current) {
         dragMovedRef.current = false;
         return;
      }
      updateZoom(scale > MIN_SCALE ? MIN_SCALE : 2);
   }

   useEffect(() => {
      function updateStageSize() {
         if (!stageRef.current) {
            return;
         }

         setStageSize({
            width: stageRef.current.clientWidth,
            height: stageRef.current.clientHeight,
         });
      }

      updateStageSize();
      window.addEventListener("resize", updateStageSize);
      return () => window.removeEventListener("resize", updateStageSize);
   }, [modal.url]);

   useEffect(() => {
      setIsLoaded(false);
      setScale(MIN_SCALE);
      setOffset({ x: 0, y: 0 });
      dragMovedRef.current = false;
      stopDragging();
      pinchStartRef.current = null;

      if (imgRef.current?.complete) {
         setIsLoaded(true);
      }
   }, [modal.url]);

   useEffect(() => {
      setOffset((previousOffset) => clampOffset(scale, previousOffset));
   }, [scale, dimensions.width, dimensions.height, viewportWidth, viewportHeight]);

   return (
      <HuginnDialogPanel
         className="relative flex h-full w-full max-w-none items-center justify-center overflow-hidden rounded-none select-none"
         headless
      >
         <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-end gap-x-2 p-4">
            <HuginnButton className="h-8 px-2" color="surface" onClick={() => openUrl(modal.url)}>
               Open original
            </HuginnButton>
            <ModalCloseButton className="static size-8" onClick={close} iconClassName="size-5" />
         </div>
         <div
            ref={stageRef}
            className="relative flex h-full w-full touch-none items-center justify-center overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onClick={close}
         >
            <div
               className={clsx(
                  "relative origin-center overflow-hidden rounded-lg",
                  isLoaded && (scale > MIN_SCALE ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"),
                  !isDragging && "transition-transform",
               )}
               style={{
                  width: `${dimensions.width}px`,
                  height: `${dimensions.height}px`,
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
               }}
               onClick={handleImageClick}
            >
               <img
                  src={modal.url}
                  ref={imgRef}
                  onLoad={() => setIsLoaded(true)}
                  draggable={false}
                  className="h-full w-full object-contain"
                  alt={modal.filename}
               />
               <Transition show={!isLoaded}>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 duration-200 data-closed:opacity-0">
                     <LoadingIcon className="size-16" />
                  </div>
               </Transition>
            </div>
         </div>
      </HuginnDialogPanel>
   );
}
