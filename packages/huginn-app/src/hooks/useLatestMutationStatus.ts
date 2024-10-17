import type { MutationVariables } from "@/types.ts";
import { type MutationState, type MutationStatus, useMutationState } from "@tanstack/react-query";

export function useMutationLatestState<Key extends keyof MutationVariables>(mutationKey: Key) {
	const mutationStates = useMutationState<MutationState<unknown, unknown, MutationVariables[Key], unknown>>({
		filters: { mutationKey: [mutationKey] },
	});

	if (mutationStates && mutationStates.length > 0) {
		return mutationStates[mutationStates.length - 1] as MutationState<unknown, unknown, MutationVariables[Key], unknown>;
	}
}
