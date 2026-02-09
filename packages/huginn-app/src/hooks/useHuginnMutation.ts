import type { HuginnErrorData } from "@huginn/shared";
import { isWorthyHuginnError } from "@lib/utils";
import { type QueryClient, type UseMutationOptions, type UseMutationResult, useMutation } from "@tanstack/react-query";
import { useErrorHandler } from "./useErrorHandler";

export function useHuginnMutation<TData = unknown, TVariables = void, TContext = unknown>(
   options: UseMutationOptions<TData, Error, TVariables, TContext>,
   handleErrors?: (errors: HuginnErrorData) => Promise<void> | void,
   queryClient?: QueryClient,
): UseMutationResult<TData, Error, TVariables, TContext> {
   const handleServerError = useErrorHandler();

   return useMutation(
      {
         ...options,
         async onError(error) {
            if (isWorthyHuginnError(error)) {
               await handleErrors?.(error.rawError);
            } else {
               handleServerError(error);
            }
         },
      },
      queryClient,
   );
}
