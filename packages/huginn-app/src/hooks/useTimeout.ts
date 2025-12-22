import { useCallback, useEffect, useRef } from "react";

export function useTimeout(callback: () => void, delay: number) {
   const savedCallback = useRef(callback);
   const timeoutId = useRef<number>(null);

   useEffect(() => {
      savedCallback.current = callback;
   }, [callback]);

   const cancel = useCallback(() => {
      if (timeoutId.current) {
         clearTimeout(timeoutId.current);
         timeoutId.current = null;
      }
   }, []);

   const start = useCallback(() => {
      cancel();
      timeoutId.current = window.setTimeout(() => savedCallback.current(), delay);
   }, [delay, cancel]);

   useEffect(() => {
      return cancel;
   }, [delay, cancel]);

   return { cancel, start };
}
