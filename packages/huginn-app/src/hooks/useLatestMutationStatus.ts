import type { MutationKinds } from "@/types";
import { type MutationState, useMutationState } from "@tanstack/react-query";

export function useMutationLatestState<Key extends keyof MutationKinds>(mutationKey?: Key) {
	const mutationStates = useMutationState<MutationState<unknown, unknown, MutationKinds[Key], unknown>>({
		filters: { mutationKey: [mutationKey] },
	});

	if (mutationStates && mutationStates.length > 0) {
		return mutationStates[mutationStates.length - 1] as MutationState<unknown, unknown, MutationKinds[Key], unknown>;
	}
}
