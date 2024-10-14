import { useClient } from "@contexts/apiContext";
import { useContextMenu } from "@contexts/contextMenuContext";
import { useUser } from "@contexts/userContext";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { usePatchDMChannel } from "@hooks/mutations/usePathDMChannel";
import { useRemoveChannelRecipient } from "@hooks/mutations/useRemoveChannelRecipient";
import { useChannelRecipients } from "@hooks/useChannelRecipients";
import { ContextMenu } from "./ContextMenu";

export function ChannelRecipientContextMenu() {
	const { context, data, close } = useContextMenu("dm_channel_recipient");
	const { user } = useUser();
	const deleteMutation = useRemoveChannelRecipient();
	const createMutation = useCreateDMChannel();
	const { ownerId } = useChannelRecipients(data?.channelId, "@me");

	if (!data || !user) return;

	return (
		<ContextMenu close={close} isOpen={context?.isOpen} position={context?.position}>
			{data.recipient.id !== user.id && (
				<>
					{user.id === ownerId && (
						<ContextMenu.Item
							label="Remove Member"
							onClick={() => {
								deleteMutation.mutate({
									channelId: data.channelId,
									recipientId: data.recipient.id,
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
