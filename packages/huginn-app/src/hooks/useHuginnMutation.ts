import { HuginnErrorData } from "@huginn/shared";
import { QueryClient, UseMutationOptions, UseMutationResult, useMutation } from "@tanstack/react-query";
import { isWorthyHuginnError } from "@lib/utils";
import { useErrorHandler } from "./useServerErrorHandler";

export function useHuginnMutation<TData = unknown, TVariables = void, TContext = unknown>(
   options: UseMutationOptions<TData, Error, TVariables, TContext>,
   handleErrors?: (errors: HuginnErrorData) => void,
   queryClient?: QueryClient,
): UseMutationResult<TData, Error, TVariables, TContext> {
   const handleServerError = useErrorHandler();

   return useMutation(
      {
         ...options,
         onError(error) {
            if (isWorthyHuginnError(error)) {
               handleErrors?.(error.rawError);
            } else {
               handleServerError(error);
            }
         },
      },
      queryClient,
   );
}
