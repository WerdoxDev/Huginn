export default function ChannelRecipientContextMenu() {
	const { data } = useContextMenu("dm_channel_recipient");
	const { user } = useUser();
	const deleteMutation = useRemoveChannelRecipient();
	const createMutation = useCreateDMChannel("create-dm-channel_recipient");
	const editMutation = usePatchDMChannel();
	const { ownerId } = useChannelRecipients(data?.channelId, "@me");

	if (!data || !user) return;

	return (
		<>
			{data.recipient.id !== user.id && (
				<>
					<ContextMenu.Item
						label="Message"
						onClick={() => {
							createMutation.mutate({ recipients: [data.recipient.id] });
						}}
					/>
					{user.id === ownerId && (
						<ContextMenu.Item
							label="Promote to Owner"
							onClick={() => {
								editMutation.mutate({
									channelId: data.channelId,
									owner: data.recipient.id,
								});
							}}
							className="!text-error focus:!bg-error/80 focus:!text-white"
						/>
					)}
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
					<ContextMenu.Divider />
				</>
			)}
			<ContextMenu.Item label="Copy User ID" onClick={() => navigator.clipboard.writeText(data.recipient.id)}>
				<IconMingcuteIdcardFill />
			</ContextMenu.Item>
		</>
	);
}
