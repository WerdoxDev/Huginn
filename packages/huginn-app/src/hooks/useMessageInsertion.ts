import type { Snowflake } from "@huginnjs/shared";

import { type RefObject, useCallback, useLayoutEffect, useRef } from "react";

import type { AppMessage } from "@/types";

const DURATION = 200;
const MESSAGE_ENTER_OFFSET = 24;
const EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";

type Snapshot = {
   channelId: Snowflake;
   keys: string[];
   top: number;
   scrollHeight: number;
};

/** Owns live insertion scrolling and animates the whole list from its previous screen position. */
export function useMessageInsertion(options: {
   channelId: Snowflake;
   messages: AppMessage[];
   userId?: Snowflake;
   scrollRef: RefObject<HTMLDivElement | null>;
   listRef: RefObject<HTMLOListElement | null>;
}) {
   const previous = useRef<Snapshot | null>(null);
   const animation = useRef<Animation | null>(null);
   const messageAnimations = useRef(new Map<Element, Animation>());
   const animationScrollTop = useRef(0);

   const cancelListAnimation = useCallback(() => {
      animation.current?.cancel();
      animation.current = null;
   }, []);

   const cancelInsertion = useCallback(() => {
      cancelListAnimation();
      for (const messageAnimation of messageAnimations.current.values()) messageAnimation.cancel();
      messageAnimations.current.clear();
   }, [cancelListAnimation]);

   // Read the running transform separately from layout, so a burst continues from its current frame.
   function getOffset(list: HTMLOListElement) {
      return animation.current ? new DOMMatrixReadOnly(getComputedStyle(list).transform).m42 : 0;
   }

   function measureTop(scroller: HTMLDivElement, list: HTMLOListElement) {
      return list.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - getOffset(list);
   }

   useLayoutEffect(() => {
      const scroller = options.scrollRef.current;
      const list = options.listRef.current;
      if (!scroller || !list) return;

      const keys = options.messages.map((message) => message.nonce ?? message.id);
      const before = previous.current;
      const sameChannel = before?.channelId === options.channelId;
      const previousKeys = new Set(sameChannel ? before.keys : []);
      const arrivals = sameChannel
         ? options.messages.filter(
              (message) => !previousKeys.has(message.nonce ?? message.id) && (message.isPreview || message.source === "websocket"),
           )
         : [];
      const isAppend = sameChannel && before.keys.every((key, index) => key === keys[index]);

      const onlyLiveAppends = isAppend && keys.length - before.keys.length === arrivals.length;
      if (!onlyLiveAppends) cancelInsertion();

      if (before && arrivals.length > 0) {
         const wasAtBottom = before.scrollHeight - scroller.clientHeight - scroller.scrollTop <= 50;
         const shouldFollow = wasAtBottom || arrivals.some((message) => message.authorId === options.userId);
         const oldTop = before.top - scroller.scrollTop + getOffset(list);
         // Retarget the list during a burst while earlier messages finish their own entrances.
         cancelListAnimation();

         if (shouldFollow) {
            // Set the real scroll position before paint; the transform supplies all visible movement.
            scroller.scrollTo({ top: scroller.scrollHeight, behavior: "instant" });
            const newTop = measureTop(scroller, list) - scroller.scrollTop;
            const distance = oldTop - newTop;
            if (wasAtBottom && onlyLiveAppends && distance > 0 && list.animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
               animationScrollTop.current = scroller.scrollTop;
               animation.current = list.animate([{ transform: `translateY(${distance}px)` }, { transform: "translateY(0)" }], {
                  duration: DURATION,
                  easing: EASING,
               });

               const arrivalIds = new Set(arrivals.map((message) => message.id));
               for (const element of list.children) {
                  if (!arrivalIds.has(element.id)) continue;
                  const entrance = element.animate(
                     [
                        { transform: `translateY(${MESSAGE_ENTER_OFFSET}px)`, opacity: 0 },
                        { transform: "translateY(0)", opacity: 1 },
                     ],
                     { duration: DURATION, easing: EASING },
                  );
                  messageAnimations.current.set(element, entrance);
                  entrance.onfinish = () => messageAnimations.current.delete(element);
               }
            }
         }
      }

      previous.current = {
         channelId: options.channelId,
         keys,
         top: measureTop(scroller, list),
         scrollHeight: scroller.scrollHeight,
      };
   });

   useLayoutEffect(() => {
      const scroller = options.scrollRef.current;
      const list = options.listRef.current;
      if (!scroller || !list) return;

      // Geometry can also change between React commits when media loads or the viewport resizes.
      const observer = new ResizeObserver(() => {
         if (!previous.current) return;
         previous.current.top = measureTop(scroller, list);
         previous.current.scrollHeight = scroller.scrollHeight;
      });
      observer.observe(scroller);
      observer.observe(list);

      const onScroll = () => {
         if (scroller.scrollTop !== animationScrollTop.current) cancelInsertion();
      };
      const onKeyDown = (event: KeyboardEvent) => {
         if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) cancelInsertion();
      };
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      scroller.addEventListener("scroll", onScroll, { passive: true });
      scroller.addEventListener("wheel", cancelInsertion, { passive: true });
      scroller.addEventListener("touchstart", cancelInsertion, { passive: true });
      scroller.addEventListener("keydown", onKeyDown);
      reducedMotion.addEventListener("change", cancelInsertion);

      return () => {
         observer.disconnect();
         scroller.removeEventListener("scroll", onScroll);
         scroller.removeEventListener("wheel", cancelInsertion);
         scroller.removeEventListener("touchstart", cancelInsertion);
         scroller.removeEventListener("keydown", onKeyDown);
         reducedMotion.removeEventListener("change", cancelInsertion);
         cancelInsertion();
      };
   }, [options.scrollRef, options.listRef, cancelInsertion]);

   return cancelInsertion;
}
