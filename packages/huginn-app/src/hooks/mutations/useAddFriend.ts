import { useClient } from "@contexts/apiContext";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import type { HuginnErrorData } from "@huginn/shared";

export function useAddFriend(onSuccess?: (username: string) => void, handleErrors?: (errors: HuginnErrorData) => void) {
	const client = useClient();

	const mutation = useHuginnMutation(
		{
			mutationKey: ["add-friend"],
			async mutationFn(username: string) {
				await client.relationships.createRelationship({ username: username });
			},
			onSuccess(_, username) {
				onSuccess?.(username);
			},
		},
		handleErrors,
	);

	return mutation;
}
