import { useEffect, useRef } from "react";

export function usePrevious<T extends any>(value: T) {
   const ref = useRef<T | null>(null);
   useEffect(() => {
      ref.current = value;
   });
   return ref.current;
}
