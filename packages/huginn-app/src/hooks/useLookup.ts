import { useMemo } from "react";

export function useLookup<T, K extends string | number>(
   items: T[] | undefined,
   keyFn: (item: T) => K,
   predicate?: (item: T) => boolean,
): Record<K, T> {
   return useMemo(
      () =>
         ((predicate ? items?.filter(predicate) : items) ?? []).reduce(
            (acc, item) => {
               acc[keyFn(item)] = item;
               return acc;
            },
            {} as Record<K, T>,
         ),
      [items, keyFn, predicate],
   );
}
