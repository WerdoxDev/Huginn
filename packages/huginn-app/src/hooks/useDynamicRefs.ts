import { useCallback, useRef, type RefObject } from "react";

export function useDynamicRefs<T>(): {
   getRef: (key: string) => RefObject<T | null>;
   setRef: (key: string) => RefObject<T | null>;
   removeRef: (key: string) => boolean;
} {
   // Use useRef to maintain refs map across renders
   const refsMap = useRef(new Map<string, RefObject<T | null>>());

   const getRef = useCallback((key: string): RefObject<T | null> => {
      // Get existing ref or create new one
      let ref = refsMap.current.get(key);
      if (!ref) {
         ref = { current: null };
         refsMap.current.set(key, ref);
      }
      return ref;
   }, []);

   const setRef = useCallback(
      (key: string): RefObject<T | null> => {
         // Always return the same ref object for the same key
         return getRef(key);
      },
      [getRef],
   );

   const removeRef = useCallback((key: string): boolean => {
      return refsMap.current.delete(key);
   }, []);

   return { getRef, setRef, removeRef };
}
