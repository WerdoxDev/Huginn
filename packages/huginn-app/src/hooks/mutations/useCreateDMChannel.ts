import type { HuginnErrorData, Snowflake } from "@huginn/shared";
import { useNavigate } from "@tanstack/react-router";

export type CreateDMChannelMutationVars = { recipients: Snowflake[]; name?: string; skipNavigation?: boolean };

export function useCreateDMChannel(handleErrors?: (errors: HuginnErrorData) => void) {
	const client = useClient();
	const navigate = useNavigate();

	const mutation = useHuginnMutation(
		{
			mutationKey: ["create-dm-channel"],
			async mutationFn(data: CreateDMChannelMutationVars) {
				return await client.channels.createDM({ recipients: data.recipients, name: data.name });
			},
			async onSuccess(data, variables) {
				if (!variables.skipNavigation) await navigate({ to: `/channels/@me/${data.id}` });
			},
		},
		handleErrors,
	);

	return mutation;
}
