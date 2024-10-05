import { useClient } from "@contexts/apiContext";
import type { Snowflake } from "@huginn/shared";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export type CreateDMChannelMutationVars = { recipients: Snowflake[]; name?: string; skipNavigation?: boolean };

export function useCreateDMChannel() {
	const client = useClient();
	const navigate = useNavigate();

	const mutation = useMutation({
		mutationKey: ["create-dm-channel"],
		async mutationFn(data: CreateDMChannelMutationVars) {
			return await client.channels.createDM({ recipients: data.recipients, name: data.name });
		},
		async onSuccess(data, variables) {
			if (!variables.skipNavigation) await navigate({ to: `/channels/@me/${data.id}` });
		},
	});

	return mutation;
}
