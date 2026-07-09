import { type InfiniteData, type QueryKey, useQueryClient } from "@tanstack/react-query";
import { useEffect, useEffectEvent } from "react";

export function useClearQueryData(queryKey: QueryKey, options?: { keepFirstPage?: boolean; clearOnUnmount?: boolean }) {
   const queryClient = useQueryClient();

   const clear = useEffectEvent(() => {
      const queriesData = queryClient.getQueriesData({ queryKey });
      if (!queriesData.length) return;

      for (const [key, data] of queriesData) {
         const isInfiniteData =
            typeof data === "object" &&
            data !== null &&
            "pages" in data &&
            "pageParams" in data &&
            Array.isArray((data as InfiniteData<unknown>).pages) &&
            Array.isArray((data as InfiniteData<unknown>).pageParams);

         if (isInfiniteData && options?.keepFirstPage) {
            const infiniteData = data as InfiniteData<unknown>;
            queryClient.setQueryData(key, {
               pages: infiniteData.pages.slice(0, 1),
               pageParams: infiniteData.pageParams.slice(0, 1),
            });
         } else {
            queryClient.removeQueries({ queryKey: key, exact: true });
         }
      }
   });

   useEffect(() => {
      return () => {
         if (options?.clearOnUnmount) clear();
      };
   }, []);

   return clear;
}
