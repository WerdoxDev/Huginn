import { ContextMenu } from "@components/contextmenu/ContextMenu.tsx";
import { useClient } from "@contexts/apiContext.tsx";
import { useContextMenu } from "@contexts/contextMenuContext.tsx";
import { useUser } from "@contexts/userContext.tsx";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel.ts";
import { usePatchDMChannel } from "@hooks/mutations/usePathDMChannel.ts";
import { useRemoveChannelRecipient } from "@hooks/mutations/useRemoveChannelRecipient.ts";
import { useChannelRecipients } from "@hooks/useChannelRecipients.ts";

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
