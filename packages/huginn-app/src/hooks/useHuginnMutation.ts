import { useErrorHandler } from "@hooks/useServerErrorHandler.ts";
import type { HuginnErrorData } from "@huginn/shared";
import { isWorthyHuginnError } from "@lib/utils.ts";
import { type QueryClient, type UseMutationOptions, type UseMutationResult, useMutation } from "@tanstack/react-query";

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
