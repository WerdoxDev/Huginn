import { type APIPatchCurrentUserJSONBody, type APIPatchCurrentUserResult, type HuginnErrorData, omit } from "@huginn/shared";

export function usePatchUser(onSuccess?: (result: APIPatchCurrentUserResult) => void, handleErrors?: (errors: HuginnErrorData) => void) {
	const client = useClient();
	const { setUser } = useUser();

	const mutation = useHuginnMutation(
		{
			mutationKey: ["patch-user"],
			async mutationFn(data: APIPatchCurrentUserJSONBody) {
				return await client.users.edit(data);
			},
			onSuccess(result) {
				onSuccess?.(result);
				const data = omit(result, ["token", "refreshToken"]);

				setUser(data);
			},
		},
		handleErrors,
	);

	return mutation;
}
