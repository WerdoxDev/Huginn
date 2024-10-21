import { ChannelType } from "@huginn/shared";

export default function ChannelsContextMenu() {
	const { context, data, close } = useContextMenu("dm_channel");
	const mutation = useDeleteDMChannel();
	const dispatch = useModalsDispatch();

	if (!data) return;

	return (
		<ContextMenu close={close} isOpen={context?.isOpen} position={context?.position}>
			<ContextMenu.Item
				label={data.type === ChannelType.DM ? "Close DM" : "Leave Group"}
				onClick={() => {
					mutation.mutate(data.id);
				}}
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
		</ContextMenu>
	);
}
