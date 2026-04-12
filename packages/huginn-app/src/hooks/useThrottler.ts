import { useEffect, useRef } from "react";

export function useThrottler<T extends any[], R>(callback: (...args: T) => R | Promise<R>, delay: number) {
   const callbackRef = useRef(callback);
   const lastCallTimeRef = useRef<number>(0);
   const timeoutRef = useRef<number | undefined>(undefined);
   const latestArgsRef = useRef<T | undefined>(undefined);

   useEffect(() => {
      callbackRef.current = callback;
   }, [callback]);

   useEffect(() => {
      return () => {
         if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
         }
      };
   }, []);

   const throttledFunction = (...args: T): void => {
      const now = Date.now();
      const elapsed = now - lastCallTimeRef.current;

      latestArgsRef.current = args;

      if (elapsed >= delay) {
         lastCallTimeRef.current = now;
         callbackRef.current(...args);
      } else if (!timeoutRef.current) {
         timeoutRef.current = window.setTimeout(() => {
            lastCallTimeRef.current = Date.now();
            timeoutRef.current = undefined;
            if (latestArgsRef.current) {
               callbackRef.current(...latestArgsRef.current);
            }
         }, delay - elapsed);
      }
   };

   return { throttledFunction };
}
