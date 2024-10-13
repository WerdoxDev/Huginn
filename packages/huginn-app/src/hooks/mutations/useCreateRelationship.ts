import { useClient } from "@contexts/apiContext";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import type { HuginnErrorData, Snowflake } from "@huginn/shared";

export type CreateRelationshipMutationVars = { username?: string; userId?: Snowflake };

export function useCreateRelationship(
	onSuccess?: (variables: CreateRelationshipMutationVars) => void,
	handleErrors?: (errors: HuginnErrorData) => void,
) {
	const client = useClient();

	const mutation = useHuginnMutation(
		{
			mutationKey: ["create-relationship"],
			async mutationFn(data: CreateRelationshipMutationVars) {
				if (data.username) {
					await client.relationships.createRelationship({ username: data.username });
				} else if (data.userId) {
					await client.relationships.createRelationshipByUserId(data.userId);
				}
			},
			onSuccess(_, variables) {
				onSuccess?.(variables);
			},
		},
		handleErrors,
	);

	return mutation;
}
