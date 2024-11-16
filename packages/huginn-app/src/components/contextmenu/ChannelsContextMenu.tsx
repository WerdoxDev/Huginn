import { ChannelType } from "@huginn/shared";

export default function ChannelsContextMenu() {
	const { data } = useContextMenu("dm_channel");
	const dispatch = useModalsDispatch();

	const name = useChannelName(data?.recipients, data?.name);
	const { tryMutate } = useSafeDeleteDMChannel(data?.id, data?.type, name);

	if (!data) return;

	return (
		<>
			<ContextMenu.Item
				label={data.type === ChannelType.DM ? "Close DM" : "Leave Group"}
				onClick={tryMutate}
				className="!text-error focus:!bg-error/80 focus:!text-white"
			/>
			{data.type === ChannelType.GROUP_DM && (
				<ContextMenu.Item label="Edit Channel" onClick={() => dispatch({ editGroup: { isOpen: true, channel: data } })}>
					<IconMingcuteEdit2Fill />
				</ContextMenu.Item>
			)}
			<ContextMenu.Divider />
			{data.type === ChannelType.DM && (
				<ContextMenu.Item label="Copy User ID" onClick={() => navigator.clipboard.writeText(data.recipients[0].id)}>
					<IconMingcuteIdcardFill />
				</ContextMenu.Item>
			)}
			<ContextMenu.Item label="Copy Channel ID" onClick={() => navigator.clipboard.writeText(data.id)}>
				<IconMingcuteIdcardFill />
			</ContextMenu.Item>
		</>
	);
}
