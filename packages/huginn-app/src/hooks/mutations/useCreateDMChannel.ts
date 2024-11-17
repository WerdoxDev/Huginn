import type { MutationKinds } from "@/types";
import type { HuginnErrorData, Snowflake } from "@huginn/shared";
import { useNavigate } from "react-router";

export type CreateDMChannelMutationVars = { recipients: Snowflake[]; name?: string; skipNavigation?: boolean };

export function useCreateDMChannel(
	key: keyof Pick<MutationKinds, "create-dm-channel_other" | "create-dm-channel_recipient">,
	handleErrors?: (errors: HuginnErrorData) => void,
) {
	const client = useClient();
	const navigate = useNavigate();

	const mutation = useHuginnMutation(
		{
			mutationKey: [key],
			async mutationFn(data: CreateDMChannelMutationVars) {
				return await client.channels.createDM({ recipients: data.recipients, name: data.name });
			},
			async onSuccess(data, variables) {
				if (!variables.skipNavigation) await navigate(`/channels/@me/${data.id}`);
			},
		},
		handleErrors,
	);

	return mutation;
}
