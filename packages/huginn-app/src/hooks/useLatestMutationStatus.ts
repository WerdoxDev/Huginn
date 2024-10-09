import { type MutationState, type MutationStatus, useMutationState } from "@tanstack/react-query";

export function useLatestMutationState<TVariables = unknown>(mutationKey: string) {
	const mutationStates = useMutationState<MutationState<unknown, unknown, TVariables, unknown>>({
		filters: { mutationKey: [mutationKey] },
	});

	if (mutationStates && mutationStates.length > 0) {
		return mutationStates[mutationStates.length - 1];
	}
}
