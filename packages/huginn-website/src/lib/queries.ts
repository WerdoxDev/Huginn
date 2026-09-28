import type { APIGetAllReleasesResult, APIGetLatestReleaseResult } from "@huginnjs/shared";

import { QueryClient, queryOptions } from "@tanstack/react-query";

export const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         refetchOnReconnect: false,
         refetchOnWindowFocus: false,
         refetchOnMount: false,
         staleTime: 60000,
      },
   },
});

export function getAllReleasesOptions(options?: { enabled?: boolean }) {
   return queryOptions({
      queryKey: ["versions"],
      queryFn: async () => {
         const url = new URL("/api/all-releases", import.meta.env.VITE_SERVER_ADDRESS).toString();
         const data = (await (await fetch(url)).json()) as APIGetAllReleasesResult;
         return data;
      },
      enabled: options?.enabled ?? true,
   });
}

export function getLatestReleaseOptions() {
   return queryOptions({
      queryKey: ["latest-release"],
      queryFn: async () => {
         const url = new URL("/api/latest-release", import.meta.env.VITE_SERVER_ADDRESS).toString();
         const data = (await (await fetch(url)).json()) as APIGetLatestReleaseResult;
         return data;
      },
   });
}
