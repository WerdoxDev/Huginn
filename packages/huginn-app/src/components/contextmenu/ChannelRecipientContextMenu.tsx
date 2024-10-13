import { useClient } from "@contexts/apiContext";
import { useContextMenu } from "@contexts/contextMenuContext";
import { useUser } from "@contexts/userContext";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { usePatchDMChannel } from "@hooks/mutations/usePathDMChannel";
import { useChannelRecipients } from "@hooks/useChannelRecipients";
import { ContextMenu } from "./ContextMenu";

export function ChannelRecipientContextMenu() {
	const { context, data, close } = useContextMenu("dm_channel_recipient");
	const { user } = useUser();
	const patchMutation = usePatchDMChannel();
	const createMutation = useCreateDMChannel();
	const { recipients, ownerId } = useChannelRecipients(data?.channelId, "@me");

	if (!data || !user) return;

	return (
		<ContextMenu close={close} isOpen={context?.isOpen} position={context?.position}>
			{data.recipient.id !== user.id && (
				<>
					{user.id === ownerId && (
						<ContextMenu.Item
							label="Remove Member"
							onClick={() => {
								patchMutation.mutate({
									channelId: data.channelId,
									recipients: [user?.id, ...(recipients?.map((x) => x.id).filter((x) => x !== data.recipient.id) ?? [])],
								});
							}}
							className="!text-error focus:!bg-error/80 focus:!text-white"
						/>
					)}
					<ContextMenu.Item
						label="Message"
						onClick={() => {
							createMutation.mutate({ recipients: [data.recipient.id] });
						}}
					/>
					<ContextMenu.Divider />
				</>
			)}
			<ContextMenu.Item label="Copy User ID" onClick={() => navigator.clipboard.writeText(data.recipient.id)}>
				<IconMdiIdentificationCard />
			</ContextMenu.Item>
		</ContextMenu>
	);
}
