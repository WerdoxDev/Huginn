import { useEffect, type DependencyList } from "react";

export function useSimpleListener(factory: () => (() => void) | void, deps?: DependencyList) {
   const effectDeps = deps ?? [];

   useEffect(() => {
      let unlisten: (() => void) | void | null = null;

      unlisten = factory();

      return () => {
         unlisten?.();
      };
   }, effectDeps);
}
