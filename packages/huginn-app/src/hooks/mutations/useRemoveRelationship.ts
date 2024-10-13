import { useClient } from "@contexts/apiContext";
import { useMutation } from "@tanstack/react-query";

export function useRemoveRelationship() {
	const client = useClient();

	const mutation = useMutation({
		mutationKey: ["remove-relationship"],
		async mutationFn(userId: string) {
			await client.relationships.delete(userId);
		},
	});

	return mutation;
}
