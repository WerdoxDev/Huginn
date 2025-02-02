import type { APIPatchDMChannelJSONBody, HuginnErrorData } from "@huginn/shared";

export type PatchDMChannelMutationVars = { channelId: string } & APIPatchDMChannelJSONBody;

export function usePatchDMChannel(handleErrors?: (errors: HuginnErrorData) => void) {
	const client = useClient();

	const mutation = useHuginnMutation(
		{
			mutationKey: ["patch-dm-channel"],
			async mutationFn(data: PatchDMChannelMutationVars) {
				return await client.channels.editDM(data.channelId, { name: data.name, icon: data.icon, owner: data.owner });
			},
		},
		handleErrors,
	);

	return mutation;
}
