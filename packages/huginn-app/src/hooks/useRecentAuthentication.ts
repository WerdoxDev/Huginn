import { CONSTANTS, HuginnAPIError, JsonCode, type HuginnErrorData } from "@huginnjs/shared";
import { useThisUser } from "@stores/userStore";
import { useRef } from "react";

import { useOAuth } from "./useOAuth";

type ErrorHandler = (error: HuginnErrorData) => Promise<boolean | void> | boolean | void;

type ActionOptions = {
   reason: string;
   openedWindow?: Window | null;
   authenticateIfStale?: boolean;
};

function isReauthenticationRequired(error: unknown): error is HuginnAPIError {
   return error instanceof HuginnAPIError && error.rawError.code === JsonCode.REAUTHENTICATION_REQUIRED;
}

export function useRecentAuthentication() {
   const { tokenPayload } = useThisUser();
   const startOAuth = useOAuth();
   const attempted = useRef(false);
   const provider = tokenPayload?.authType === "oauth" ? tokenPayload.authProvider : undefined;

   function handleMutationError(error: HuginnErrorData, onError?: ErrorHandler, onReauthenticationFailed?: ErrorHandler) {
      if (error.code === JsonCode.REAUTHENTICATION_REQUIRED && provider) {
         if (!attempted.current) return true;
         if (onReauthenticationFailed) return onReauthenticationFailed(error);
      }
      return onError?.(error);
   }

   async function run<T>(
      action: () => Promise<T>,
      { reason, openedWindow, authenticateIfStale = false }: ActionOptions,
   ): Promise<{ value: T } | null> {
      attempted.current = false;
      const reauthenticate = async () => {
         if (!provider) return false;
         attempted.current = true;
         const result = await startOAuth(
            provider,
            openedWindow === undefined ? { reauthenticationFor: reason } : { reauthenticationFor: reason, openedWindow },
         );
         return !!result?.handoff_code;
      };

      try {
         if (authenticateIfStale && provider) {
            const margin = Math.min(60_000, CONSTANTS.OAUTH_SENSITIVE_REAUTH_WINDOW / 10);
            if (Date.now() - (tokenPayload?.lastAuthenticatedAt ?? 0) >= CONSTANTS.OAUTH_SENSITIVE_REAUTH_WINDOW - margin) {
               if (!(await reauthenticate())) return null;
            }
         }

         try {
            return { value: await action() };
         } catch (error) {
            if (!provider || attempted.current || !isReauthenticationRequired(error)) throw error;
            if (!(await reauthenticate())) return null;
            return { value: await action() };
         }
      } finally {
         attempted.current = false;
      }
   }

   return { run, handleMutationError };
}
