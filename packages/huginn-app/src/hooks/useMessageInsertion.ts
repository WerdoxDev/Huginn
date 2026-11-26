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
   messageTops: Map<Element, number>;
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

   function messageOffset(element: Element) {
      return messageAnimations.current.has(element) ? new DOMMatrixReadOnly(getComputedStyle(element).transform).m42 : 0;
   }

   function measureMessages(scroller: HTMLDivElement, list: HTMLOListElement) {
      const origin = scroller.getBoundingClientRect().top - scroller.scrollTop + getOffset(list);
      return new Map(
         Array.from(list.children)
            .filter((element) => element.id)
            .map((element) => [element, element.getBoundingClientRect().top - origin - messageOffset(element)]),
      );
   }

   function animateMessage(element: Element, offset: number, opacity: number) {
      messageAnimations.current.get(element)?.cancel();
      const entrance = element.animate(
         [
            { transform: `translateY(${offset}px)`, opacity },
            { transform: "translateY(0)", opacity: 1 },
         ],
         { duration: DURATION, easing: EASING },
      );
      messageAnimations.current.set(element, entrance);
      entrance.onfinish = () => {
         if (messageAnimations.current.get(element) === entrance) messageAnimations.current.delete(element);
      };
   }

   useLayoutEffect(() => {
      const scroller = options.scrollRef.current;
      const list = options.listRef.current;
      if (!scroller || !list) return;

      const keys = options.messages.map((message) => message.nonce ?? message.id);
      const before = previous.current;
      const oldListOffset = getOffset(list);
      // Removing the unread divider may clamp scrollTop before its scroll event is delivered.
      const clampedByRemoval =
         animation.current &&
         before &&
         scroller.scrollHeight < before.scrollHeight &&
         scroller.scrollTop < animationScrollTop.current &&
         scroller.scrollTop === Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      const oldScrollTop = clampedByRemoval ? animationScrollTop.current : scroller.scrollTop;
      if (clampedByRemoval) animationScrollTop.current = scroller.scrollTop;
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
         const oldTop = before.top - oldScrollTop + oldListOffset;
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
                  animateMessage(element, MESSAGE_ENTER_OFFSET, 0);
               }
            }
         }
      }

      const messageTops = measureMessages(scroller, list);
      if (onlyLiveAppends && before && animation.current && ["running", "paused"].includes(animation.current.playState)) {
         const listOffset = getOffset(list);
         const corrections: { element: Element; offset: number; opacity: number }[] = [];
         // A list transform cannot cover spacing changes inside the list, such as the unread divider disappearing.
         for (const [element, top] of messageTops) {
            const previousTop = before.messageTops.get(element);
            if (previousTop === undefined) continue;
            const offset = messageOffset(element);
            const previousViewportTop = previousTop - oldScrollTop + oldListOffset + offset;
            const viewportTop = top - scroller.scrollTop + listOffset + offset;
            const correction = previousViewportTop - viewportTop;
            if (Math.abs(correction) < 0.1) continue;
            const height = element.getBoundingClientRect().height;
            if (Math.max(previousViewportTop, viewportTop) + height < 0 || Math.min(previousViewportTop, viewportTop) > scroller.clientHeight)
               continue;
            const style = getComputedStyle(element);
            corrections.push({ element, offset: offset + correction, opacity: Number(style.opacity) });
         }
         // Finish the geometry reads before starting animations, and leave offscreen messages alone.
         for (const correction of corrections) animateMessage(correction.element, correction.offset, correction.opacity);
      }

      previous.current = {
         channelId: options.channelId,
         keys,
         top: measureTop(scroller, list),
         scrollHeight: scroller.scrollHeight,
         messageTops,
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
         previous.current.messageTops = measureMessages(scroller, list);
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
