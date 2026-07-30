import type { HuginnErrorData } from "@huginnjs/shared";

import { isWorthyHuginnError } from "@lib/utils";
import { type QueryClient, type UseMutationOptions, type UseMutationResult, useMutation } from "@tanstack/react-query";

import { useErrorHandler } from "./useErrorHandler";

export function useHuginnMutation<TData = unknown, TVariables = void, TContext = unknown>(
   options: UseMutationOptions<TData, Error, TVariables, TContext>,
   handleErrors?: (errors: HuginnErrorData) => Promise<boolean | void> | boolean | void,
   queryClient?: QueryClient,
   alwaysFallback?: boolean,
): UseMutationResult<TData, Error, TVariables, TContext> {
   const fallbackHandleError = useErrorHandler();

   return useMutation(
      {
         ...options,
         async onError(error) {
            console.error("Mutation error:", error);
            if (isWorthyHuginnError(error) && handleErrors) {
               const handled = await handleErrors(error.rawError);
               if (!handled || alwaysFallback) fallbackHandleError(error);
            } else {
               fallbackHandleError(error);
            }
         },
      },
      queryClient,
   );
}
