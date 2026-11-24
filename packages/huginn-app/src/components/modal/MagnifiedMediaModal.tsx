import { Dialog } from "@base-ui/react";
import LoadingBackground from "@components/LoadingBackground";
import MediaViewerPreview from "@components/MediaViewerPreview";
import VideoPlayer from "@components/VideoPlayer";
import { useMediaViewerGestures } from "@hooks/useMediaViewerGestures";
import { useMediaViewerTransition } from "@hooks/useMediaViewerTransition";
import { useOpen } from "@hooks/useOpen";
import { HuginnButton, ModalCloseButton } from "@huginn/frontend-shared";
import { constrainImageSize } from "@huginnjs/shared";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";

export default function MagnifiedMediaModal() {
   const { magnifiedMedia: modal, updateModals } = useModals();
   const [isLoaded, setIsLoaded] = useState(false);
   const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null);
   const panelRef = useRef<HTMLDivElement>(null);
   const transitionRef = useRef<HTMLDivElement>(null);
   const stageRef = useRef<HTMLDivElement>(null);
   const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
   const { openUrl } = useOpen();
   const { focused } = useHuginnWindow();

   useEffect(() => {
      const video = mediaRef.current;
      if (!(video instanceof HTMLVideoElement)) return;
      if (modal.isOpen && focused) void video.play().catch(() => {});
      else video.pause();
      return () => video.pause();
   }, [modal.isOpen, modal.url, focused]);

   const viewportWidth = stageSize.width || window.innerWidth;
   const viewportHeight = stageSize.height || window.innerHeight;

   const dimensions = useMemo(() => {
      const horizontalPadding = viewportWidth < 1024 ? 24 : 80;
      const verticalPadding = viewportWidth < 1024 ? 120 : 100;
      return constrainImageSize(modal.width, modal.height, viewportWidth - horizontalPadding, viewportHeight - verticalPadding);
   }, [modal.width, modal.height, viewportHeight, viewportWidth]);

   function close() {
      updateModals({ magnifiedMedia: { isOpen: false } });
   }

   const gestures = useMediaViewerGestures({
      stageRef,
      mediaKey: modal.url,
      isVideo: modal.kind === "video",
      enabled: modal.isOpen,
      ...dimensions,
      viewportWidth,
      viewportHeight,
   });

   useLayoutEffect(() => {
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
      const observer = new ResizeObserver(updateStageSize);
      if (stageRef.current) observer.observe(stageRef.current);
      window.addEventListener("resize", updateStageSize);
      return () => {
         observer.disconnect();
         window.removeEventListener("resize", updateStageSize);
      };
   }, [modal.url]);

   useEffect(() => {
      setIsLoaded(false);
      if (
         mediaRef.current &&
         (("complete" in mediaRef.current && mediaRef.current.complete) || ("readyState" in mediaRef.current && mediaRef.current.readyState >= 2))
      ) {
         setIsLoaded(true);
      }
   }, [modal.url]);

   useMediaViewerTransition({ panelRef, transitionRef, source: modal.source, isOpen: modal.isOpen, isLoaded });

   return (
      <Dialog.Popup
         ref={panelRef}
         className="relative flex h-full w-full max-w-none items-center justify-center overflow-hidden rounded-none outline-none select-none"
      >
         <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-end gap-x-2 p-4 opacity-(--media-viewer-controls-opacity)">
            <HuginnButton className="h-8 px-2" color="surface" onClick={() => openUrl(modal.url)}>
               Open original
            </HuginnButton>
            <ModalCloseButton title="Close media viewer" className="static size-8" onClick={close} iconClassName="size-5" />
         </div>
         <div
            ref={stageRef}
            className="relative flex h-full w-full items-center justify-center overflow-hidden"
            {...gestures.stageHandlers}
            style={gestures.stageStyle}
            onClick={close}
         >
            {modal.kind === "video" ? (
               <VideoPlayer
                  key={modal.url}
                  url={modal.url}
                  width={dimensions.width}
                  height={dimensions.height}
                  active={modal.isOpen}
                  pictureStyle={gestures.pictureStyle}
                  transitionRef={transitionRef}
                  preview={modal.source?.preview}
                  onLoadedData={() => setIsLoaded(true)}
               />
            ) : (
               <div
                  ref={transitionRef}
                  data-media-transition
                  className="relative shrink-0"
                  style={{ width: dimensions.width, height: dimensions.height }}
               >
                  <div
                     className={clsx(
                        "relative origin-center overflow-hidden rounded-lg",
                        gestures.scale > 1 ? (gestures.isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
                     )}
                     style={{
                        width: `${dimensions.width}px`,
                        height: `${dimensions.height}px`,
                        ...gestures.pictureStyle,
                     }}
                     data-media-picture
                     onClick={(event) => {
                        event.stopPropagation();
                        gestures.toggleZoom();
                     }}
                  >
                     {modal.type === "image" ? (
                        <img
                           src={modal.url}
                           ref={mediaRef as RefObject<HTMLImageElement>}
                           onLoad={() => setIsLoaded(true)}
                           draggable={false}
                           className="h-full w-full object-contain"
                           style={{ visibility: isLoaded ? undefined : "hidden" }}
                           alt={modal.filename}
                        />
                     ) : (
                        <video
                           src={modal.url}
                           ref={mediaRef as RefObject<HTMLVideoElement>}
                           onLoadedData={() => requestAnimationFrame(() => setIsLoaded(true))}
                           draggable={false}
                           className="h-full w-full object-contain"
                           style={{ visibility: isLoaded ? undefined : "hidden" }}
                           autoPlay={focused && modal.isOpen}
                           playsInline
                           muted
                           loop
                        />
                     )}
                     {!isLoaded && modal.source?.preview && <MediaViewerPreview preview={modal.source.preview} />}
                     {!modal.source?.preview && <LoadingBackground isLoaded={isLoaded} hasError={false} />}
                  </div>
               </div>
            )}
         </div>
      </Dialog.Popup>
   );
}
