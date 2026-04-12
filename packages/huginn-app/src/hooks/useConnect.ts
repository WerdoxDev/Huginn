import type { InitializationResult } from "@huginn/api";

import { useCallback } from "react";

import { useInitializeClient } from "./useInitializeClient";

export function useConnect() {
   const initialize = useInitializeClient();

   const connect = useCallback(async () => {
      const token = localStorage.getItem("access-token") ?? undefined;
      const refreshToken = localStorage.getItem("refresh-token") ?? undefined;

      if (!token && !refreshToken) {
         return {
            success: false,
            status: "invalid_tokens",
            retryable: false,
         } as InitializationResult;
      }

      const result = await initialize({
         token: token ?? undefined,
         refreshToken: refreshToken ?? undefined,
      });

      if (!result.retryable && !result.success) {
         localStorage.removeItem("refresh-token");
         localStorage.removeItem("access-token");
      }

      return result;
   }, [initialize]);

   return connect;
}
