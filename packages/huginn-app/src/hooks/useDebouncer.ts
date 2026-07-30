import { useEffect, useRef } from "react";

export class DebounceCancelledError extends Error {
   constructor() {
      super("Debounced call was cancelled");
      this.name = "DebounceCancelledError";
   }
}

export function useDebouncer<T extends any[], R>(callback: (...args: T) => R | Promise<R>, delay: number) {
   const timeoutRef = useRef<number | undefined>(undefined);
   const callbackRef = useRef(callback);
   const pendingRef = useRef<Array<{ resolve: (value: R) => void; reject: (err: unknown) => void }>>([]);
   const lastArgsRef = useRef<T | undefined>(undefined);
   const lastResultRef = useRef<R | undefined>(undefined);
   const hasResultRef = useRef(false); // fixes: cache never engaged when R was `undefined`
   const executionIdRef = useRef(0); // fixes: overlapping async calls corrupting the cache

   // Keep callback ref up to date
   useEffect(() => {
      callbackRef.current = callback;
   }, [callback]);

   // Cleanup on unmount
   useEffect(() => {
      return () => {
         if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
         }
      };
   }, []);

   const cancel = () => {
      if (timeoutRef.current) {
         window.clearTimeout(timeoutRef.current);
         timeoutRef.current = undefined;
      }

      // Invalidate any execution that's still in flight so its result
      // won't be written to the cache once it eventually resolves.
      // (We can't actually abort a callback that's already mid-await —
      // there's no AbortSignal plumbed into it — but we can stop trusting
      // its result.)
      executionIdRef.current++;

      // Reject only calls that are still waiting on an unfired timer.
      // (Calls whose timer already fired were pulled off this list when
      // the timeout callback started running, so they're unaffected here.)
      const pending = pendingRef.current;
      pendingRef.current = [];
      pending.forEach(({ reject }) => reject(new DebounceCancelledError()));
   };

   const argsEqual = (args1: T | undefined, args2: T): boolean => {
      if (!args1) return false;
      if (args1.length !== args2.length) return false;
      return args1.every((arg, i) => arg === args2[i]);
   };

   const debouncedFunction = (...args: T): Promise<R> => {
      return new Promise((resolve, reject) => {
         // Check if args are the same as last call
         if (argsEqual(lastArgsRef.current, args) && hasResultRef.current) {
            // Return cached result immediately without calling the function
            resolve(lastResultRef.current as R);
            return;
         }

         // Clear any existing timeout
         if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
         }

         // Track this call so cancel() can reject it if it's still pending
         pendingRef.current.push({ resolve, reject });

         const executionId = ++executionIdRef.current;

         // Set new timeout
         timeoutRef.current = window.setTimeout(async () => {
            // Clear immediately (not after the await) so a call that comes in
            // while this callback is still running starts its own fresh cycle
            // instead of silently clearing an already-fired timer id.
            timeoutRef.current = undefined;

            const resolvers = pendingRef.current;
            pendingRef.current = [];

            try {
               const result = await callbackRef.current(...args);

               // Only commit to the cache if no newer call (or cancel) has
               // happened since this one was scheduled — prevents a slow,
               // stale execution from clobbering a fresher result.
               if (executionId === executionIdRef.current) {
                  lastArgsRef.current = args;
                  lastResultRef.current = result;
                  hasResultRef.current = true;
               }

               resolvers.forEach(({ resolve: r }) => r(result));
            } catch (err) {
               resolvers.forEach(({ reject: rj }) => rj(err));
            }
         }, delay);
      });
   };

   return { debouncedFunction, cancel };
}
