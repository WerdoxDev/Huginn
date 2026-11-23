import type { MediaViewerSource } from "@lib/media-viewer-source";
import type { RefObject } from "react";

import { useLayoutEffect, useRef } from "react";

const DURATION = 200;
const EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";

/** The outer wrapper owns FLIP; the inner picture keeps the viewer's zoom and pan. */
export function useMediaViewerTransition(options: {
   panelRef: RefObject<HTMLDivElement | null>;
   transitionRef: RefObject<HTMLDivElement | null>;
   source?: MediaViewerSource;
   isOpen: boolean;
   isLoaded: boolean;
}) {
   const interrupted = useRef<{ transform: string; clipPath: string } | null>(null);
   const controlsOpacity = useRef<string | null>(null);
   const previewOpacity = useRef<string | null>(null);
   const frameStyle = useRef<{ borderRadius: string; opacity: string } | null>(null);

   const canEnter = options.isLoaded || Boolean(options.source?.preview);

   useLayoutEffect(() => {
      const panel = options.panelRef.current;
      if (!panel?.animate || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

      // Base UI observes this popup animation to retain the portal through closing.
      // Only controls consume the inherited value, including controls mounted after loading.
      const animation = panel.animate(
         [
            { "--media-viewer-controls-opacity": controlsOpacity.current ?? (options.isOpen ? "0" : "1") },
            { "--media-viewer-controls-opacity": options.isOpen ? "1" : "0" },
         ],
         { duration: DURATION, easing: EASING, fill: "both" },
      );
      return () => {
         controlsOpacity.current = getComputedStyle(panel).getPropertyValue("--media-viewer-controls-opacity");
         animation.cancel();
      };
   }, [options.isOpen, options.panelRef, options.source]);

   useLayoutEffect(() => {
      const panel = options.panelRef.current;
      const wrapper = options.transitionRef.current;
      if (!panel || !wrapper || (options.isOpen && !canEnter)) return;

      const previousFrame = interrupted.current;
      interrupted.current = null;
      const animations: Animation[] = [];
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion || !wrapper.animate) return;

      const source = options.source;
      const target = source?.boundsElement.isConnected ? source.boundsElement.getBoundingClientRect() : undefined;
      const origin = options.isOpen ? source?.rect : target;
      const bounds = wrapper.getBoundingClientRect();
      const visible =
         origin &&
         origin.width > 0 &&
         origin.height > 0 &&
         origin.left < window.innerWidth &&
         origin.top < window.innerHeight &&
         origin.left + origin.width > 0 &&
         origin.top + origin.height > 0;
      let restoreSource = () => {};
      let previewOverlay: HTMLDivElement | undefined;
      let previewFrame: HTMLDivElement | undefined;

      if (source && visible && bounds.width > 0 && bounds.height > 0) {
         const scale = Math.max(origin.width / bounds.width, origin.height / bounds.height);
         const dx = origin.left + origin.width / 2 - (bounds.left + bounds.width / 2);
         const dy = origin.top + origin.height / 2 - (bounds.top + bounds.height / 2);
         const insetX = Math.max(0, (bounds.width - origin.width / scale) / 2);
         const insetY = Math.max(0, (bounds.height - origin.height / scale) / 2);
         const radius = source.borderRadius;
         const thumbnail = {
            transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
            clipPath: `inset(${insetY}px ${insetX}px round ${radius / scale}px)`,
         };
         const picture = wrapper.querySelector<HTMLElement>("[data-media-picture]");
         const pictureBounds = picture?.getBoundingClientRect() ?? bounds;
         const enlarged = {
            transform: "none",
            clipPath: `inset(${Math.min(0, pictureBounds.top - bounds.top)}px ${Math.min(0, bounds.right - pictureBounds.right)}px ${Math.min(0, bounds.bottom - pictureBounds.bottom)}px ${Math.min(0, pictureBounds.left - bounds.left)}px round 8px)`,
         };
         const visibility = source.element.style.visibility;
         source.element.style.visibility = "hidden";
         restoreSource = () => {
            source.element.style.visibility = visibility;
         };

         if (source.frame?.width && wrapper.parentElement) {
            // The ring sits outside the picture's clip, so animate it as a sibling.
            previewFrame = document.createElement("div");
            previewFrame.setAttribute("aria-hidden", "true");
            Object.assign(previewFrame.style, {
               position: "absolute",
               pointerEvents: "none",
               left: `${wrapper.offsetLeft}px`,
               top: `${wrapper.offsetTop}px`,
               width: `${bounds.width}px`,
               height: `${bounds.height}px`,
               boxShadow: `0 0 0 ${source.frame.width / scale}px ${source.frame.color}`,
            });
            wrapper.parentElement.append(previewFrame);
            const rounded = { borderRadius: `${radius / scale}px`, opacity: "1" };
            const expanded = { borderRadius: "8px", opacity: "0" };
            animations.push(
               previewFrame.animate(
                  [
                     {
                        transform: previousFrame?.transform ?? (options.isOpen ? thumbnail.transform : "none"),
                        ...(frameStyle.current ?? (options.isOpen ? rounded : expanded)),
                     },
                     { transform: options.isOpen ? "none" : thumbnail.transform, ...(options.isOpen ? expanded : rounded) },
                  ],
                  { duration: DURATION, easing: EASING, fill: "both" },
               ),
            );
         }

         const overlays = source.overlays;
         if (overlays.length) {
            // Keep thumbnail decorations above the moving media, inside the portal.
            // Their thumbnail-sized layout scales to match the return destination exactly.
            previewOverlay = document.createElement("div");
            previewOverlay.inert = true;
            previewOverlay.setAttribute("aria-hidden", "true");
            Object.assign(previewOverlay.style, {
               position: "absolute",
               left: "50%",
               top: "50%",
               pointerEvents: "none",
               zIndex: "1",
               width: `${origin.width}px`,
               height: `${origin.height}px`,
               transform: `translate(-50%, -50%) scale(${1 / scale})`,
            });
            overlays.forEach((overlay) => previewOverlay!.append(overlay.cloneNode(true)));
            wrapper.append(previewOverlay);
            animations.push(
               previewOverlay.animate([{ opacity: previewOpacity.current ?? (options.isOpen ? "1" : "0") }, { opacity: options.isOpen ? 0 : 1 }], {
                  duration: DURATION,
                  easing: EASING,
                  fill: "both",
               }),
            );
         }

         animations.push(
            wrapper.animate(options.isOpen ? [previousFrame ?? thumbnail, enlarged] : [previousFrame ?? enlarged, thumbnail], {
               duration: DURATION,
               easing: EASING,
               fill: options.isOpen ? "backwards" : "both",
            }),
         );

         if (!options.isOpen) {
            if (picture)
               animations.push(
                  picture.animate([{ transform: getComputedStyle(picture).transform }, { transform: "none" }], {
                     duration: DURATION,
                     easing: EASING,
                     fill: "both",
                  }),
               );
         }
      }

      if (!options.isOpen) void Promise.all(animations.map((animation) => animation.finished)).then(restoreSource, () => {});

      return () => {
         const style = getComputedStyle(wrapper);
         interrupted.current = animations.some((animation) => animation.playState === "running" || animation.playState === "paused")
            ? { transform: style.transform, clipPath: style.clipPath }
            : null;
         if (previewOverlay) {
            previewOpacity.current = getComputedStyle(previewOverlay).opacity;
            previewOverlay.remove();
         }
         if (previewFrame) {
            const style = getComputedStyle(previewFrame);
            frameStyle.current = { borderRadius: style.borderRadius, opacity: style.opacity };
            previewFrame.remove();
         }
         animations.forEach((animation) => animation.cancel());
         restoreSource();
      };
   }, [options.isOpen, canEnter, options.source, options.panelRef, options.transitionRef]);
}
