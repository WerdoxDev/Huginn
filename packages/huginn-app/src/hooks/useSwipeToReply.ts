import { useRef, useState, type TouchEventHandler } from "react";

const DIRECTION_LOCK_DISTANCE = 8;
const REPLY_THRESHOLD_RATIO = 0.2;

type Gesture = {
   identifier: number;
   startX: number;
   startY: number;
   isReplyReady: boolean;
};

export function useSwipeToReply(onReply: () => void) {
   const gesture = useRef<Gesture | null>(null);
   const [swipeX, setSwipeX] = useState(0);
   const [isReplyReady, setIsReplyReady] = useState(false);

   function resetGesture() {
      gesture.current = null;
      setSwipeX(0);
      setIsReplyReady(false);
   }

   const onTouchStart: TouchEventHandler<HTMLDivElement> = (event) => {
      if (event.touches.length !== 1) {
         resetGesture();
         return;
      }

      const touch = event.touches[0];
      gesture.current = {
         identifier: touch.identifier,
         startX: touch.clientX,
         startY: touch.clientY,
         isReplyReady: false,
      };
      setSwipeX(0);
      setIsReplyReady(false);
   };

   const onTouchMove: TouchEventHandler<HTMLDivElement> = (event) => {
      const activeGesture = gesture.current;
      if (activeGesture === null) return;
      if (event.touches.length !== 1) {
         resetGesture();
         return;
      }

      const touch = event.touches[0];
      if (touch.identifier !== activeGesture.identifier) {
         resetGesture();
         return;
      }

      const deltaX = touch.clientX - activeGesture.startX;
      const deltaY = touch.clientY - activeGesture.startY;
      const absoluteDeltaX = Math.abs(deltaX);
      const absoluteDeltaY = Math.abs(deltaY);

      if (absoluteDeltaY >= DIRECTION_LOCK_DISTANCE && absoluteDeltaY > absoluteDeltaX) {
         resetGesture();
         return;
      }

      if (absoluteDeltaX < DIRECTION_LOCK_DISTANCE || deltaX >= 0) {
         activeGesture.isReplyReady = false;
         setSwipeX(0);
         setIsReplyReady(false);
         return;
      }

      const replyThreshold = window.innerWidth * REPLY_THRESHOLD_RATIO;
      const nextIsReplyReady = absoluteDeltaX >= replyThreshold;

      activeGesture.isReplyReady = nextIsReplyReady;
      setSwipeX(deltaX);
      setIsReplyReady(nextIsReplyReady);
   };

   const onTouchEnd: TouchEventHandler<HTMLDivElement> = () => {
      const shouldReply = gesture.current?.isReplyReady === true;
      resetGesture();

      if (shouldReply) onReply();
   };

   const onTouchCancel: TouchEventHandler<HTMLDivElement> = () => {
      resetGesture();
   };

   return {
      swipeX,
      isReplyReady,
      touchHandlers: {
         onTouchStart,
         onTouchMove,
         onTouchEnd,
         onTouchCancel,
      },
   };
}
