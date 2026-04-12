import { useEffect, useRef } from "react";

export function useEffectSkipMount(effect: React.EffectCallback, deps?: React.DependencyList) {
   const isFirstRender = useRef(true);
   useEffect(() => {
      if (isFirstRender.current) {
         isFirstRender.current = false;
         return;
      }
      return effect();
   }, deps);
}
