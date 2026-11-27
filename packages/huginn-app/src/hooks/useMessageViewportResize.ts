import { type RefObject, useCallback, useLayoutEffect, useRef } from "react";

import type { AppMessage } from "@/types";

// const TIMING: KeyframeAnimationOptions = { duration: 200, easing: "cubic-bezier(0.4, 0, 0.2, 1)"};
const DURATION = 200;
const EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";

type Animate = (element: HTMLElement, keyframes: Keyframe[]) => void;

export type MessageViewportHandle = {
   resize: (updateLayout: (animate?: Animate) => void, animate: boolean, onFinish: () => void) => () => void;
};

/** Owns the composer and viewport animations, including scroll restoration and interruption cleanup. */
export function useMessageViewportResize(options: {
   channelId: string;
   messages: AppMessage[];
   scrollRef: RefObject<HTMLDivElement | null>;
   listRef: RefObject<HTMLOListElement | null>;
   shouldAnchorToBottom: RefObject<boolean>;
   isResizing: RefObject<boolean>;
}) {
   const viewportRef = useRef<HTMLDivElement>(null);
   const resizeRef = useRef<HTMLDivElement>(null);
   const isAnimating = useRef(false);
   const finishRef = useRef<(() => void) | null>(null);
   const finish = useCallback(() => finishRef.current?.(), []);

   const resize = useCallback(
      (updateLayout: (animate?: Animate) => void, shouldAnimate: boolean, onFinish: () => void) => {
         const viewport = viewportRef.current;
         const scroller = options.scrollRef.current;
         const list = options.listRef.current;
         const content = resizeRef.current;
         if (!viewport || !scroller || !list || !content) {
            finish();
            updateLayout();
            onFinish();
            return () => {};
         }

         // The insertion transform is constant during these synchronous reads and cancels in the differences.
         const listTop = () => list.getBoundingClientRect().top;
         const oldTop = listTop();
         const oldHeight = scroller.clientHeight;
         // A scroll event may still be queued when the user opens the preview.
         options.shouldAnchorToBottom.current = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop <= 20;
         finish();
         isAnimating.current = true;
         const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
         const animate = shouldAnimate && typeof content.animate === "function" && !reducedMotion.matches;
         const animations: Animation[] = [];
         updateLayout(
            animate
               ? (element, keyframes) => animations.push(element.animate(keyframes, { duration: DURATION, easing: EASING, fill: "both" }))
               : undefined,
         );
         if (options.shouldAnchorToBottom.current) {
            scroller.scrollTo({ top: scroller.scrollHeight, behavior: "instant" });
         }
         if (!animate) {
            isAnimating.current = false;
            onFinish();
            return () => {};
         }

         const targetTop = listTop();
         const targetScrollTop = scroller.scrollTop;
         const targetHeight = viewport.clientHeight;
         const targetWidth = viewport.clientWidth;

         // Keep the larger clipping area until the moving composer covers/reveals it.
         // These dimensions change only at the endpoints, never on animation frames.
         viewport.style.overflow = "visible";
         scroller.style.height = `${Math.max(oldHeight, targetHeight)}px`;
         if (options.shouldAnchorToBottom.current) scroller.scrollTo({ top: scroller.scrollHeight, behavior: "instant" });
         const frozenScrollTop = scroller.scrollTop;
         const frozenTop = listTop();
         const animation = content.animate(
            [{ transform: `translateY(${oldTop - frozenTop}px)` }, { transform: `translateY(${targetTop - frozenTop}px)` }],
            { duration: DURATION, easing: EASING, fill: "both" },
         );
         animations.push(animation);
         const listeners = new AbortController();

         const settle = () => {
            if (finishRef.current !== settle) return;
            finishRef.current = null;
            const scrollDelta = scroller.scrollTop - frozenScrollTop;
            scroller.style.height = "";
            viewport.style.overflow = "";
            const nextScrollTop = options.shouldAnchorToBottom.current
               ? scroller.scrollHeight - scroller.clientHeight
               : targetScrollTop + scrollDelta;
            options.isResizing.current = nextScrollTop !== scroller.scrollTop;
            scroller.scrollTo({ top: nextScrollTop, behavior: "instant" });
            for (const animation of animations) animation.cancel();
            observer.disconnect();
            listeners.abort();
            isAnimating.current = false;
            onFinish();
         };
         const onKeyDown = (event: KeyboardEvent) => {
            if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) settle();
         };
         const observer = new ResizeObserver(() => {
            if (viewport.clientHeight !== targetHeight || viewport.clientWidth !== targetWidth) settle();
         });
         observer.observe(viewport);
         reducedMotion.addEventListener("change", settle, { signal: listeners.signal });
         scroller.addEventListener("pointerdown", settle, { passive: true, signal: listeners.signal });
         scroller.addEventListener("wheel", settle, { passive: true, signal: listeners.signal });
         scroller.addEventListener("keydown", onKeyDown, { signal: listeners.signal });
         finishRef.current = settle;
         animation.onfinish = settle;
         return settle;
      },
      [options.scrollRef, options.listRef, options.shouldAnchorToBottom, options.isResizing, finish],
   );

   // Settle before insertion or channel changes start measuring the list again.
   useLayoutEffect(() => finish, [options.messages, options.channelId, finish]);

   return { viewportRef, resizeRef, resize, isAnimating, finish };
}
