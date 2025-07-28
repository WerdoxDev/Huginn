import type { MutationKinds } from "@/types";
import { Mutation, type MutationState, useMutationState } from "@tanstack/react-query";

export function useMutationLatestState<Key extends keyof MutationKinds>(
   mutationKey?: Key,
   predicate?: (mutation: Mutation<unknown, unknown, MutationKinds[Key], unknown>) => boolean,
) {
   const mutationStates = useMutationState<MutationState<unknown, Error, unknown, unknown>>({
      filters: {
         mutationKey: [mutationKey],
         predicate: predicate as ((mutation: Mutation) => boolean) | undefined,
      },
   });

   if (mutationStates && mutationStates.length > 0) {
      return mutationStates[mutationStates.length - 1] as MutationState<unknown, unknown, MutationKinds[Key], unknown>;
   }
}
