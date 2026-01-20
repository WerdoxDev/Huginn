import { useEffect, useRef } from "react";

export function useDebouncer<T extends any[], R>(
  callback: (...args: T) => R | Promise<R>,
  delay: number
) {
  const timeoutRef = useRef<number | undefined>(undefined);
  const callbackRef = useRef(callback);
  const pendingResolversRef = useRef<Array<(value: R) => void>>([]);
  const lastArgsRef = useRef<T | undefined>(undefined);
  const lastResultRef = useRef<R | undefined>(undefined);

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
    // Clear pending resolvers without resolving them
    pendingResolversRef.current = [];
  };

  const argsEqual = (args1: T | undefined, args2: T): boolean => {
    if (!args1) return false;
    if (args1.length !== args2.length) return false;
    return args1.every((arg, i) => arg === args2[i]);
  };

  const debouncedFunction = (...args: T): Promise<R> => {
    return new Promise((resolve) => {
      // Check if args are the same as last call
      if (argsEqual(lastArgsRef.current, args) && lastResultRef.current !== undefined) {
        // Return cached result immediately without calling the function
        resolve(lastResultRef.current);
        return;
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      // Store new args
      lastArgsRef.current = args;

      // Add this resolver to the list
      pendingResolversRef.current.push(resolve);

      // Set new timeout
      timeoutRef.current = window.setTimeout(async () => {
        const result = await callbackRef.current(...args);
        timeoutRef.current = undefined;
        lastResultRef.current = result;

        // Resolve all pending promises with the same result
        const resolvers = pendingResolversRef.current;
        pendingResolversRef.current = [];
        resolvers.forEach(r => r(result));
      }, delay);
    });
  };

  return { debouncedFunction, cancel };
}
