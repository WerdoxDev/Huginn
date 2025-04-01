import { useChannelName } from "@hooks/api-hooks/channelHooks";
import { useSafeDeleteDMChannel } from "@hooks/useSafeDeleteDMChannel";
import { ChannelType } from "@huginn/shared";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import ContextMenu from "./ContextMenu";

export default function ChannelsContextMenu() {
	const { data } = useContextMenu("dm_channel");
	const { updateModals } = useModals();

	const name = useChannelName(data?.id);
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
				<ContextMenu.Item label="Edit Channel" onClick={() => updateModals({ editGroup: { isOpen: true, channel: data } })}>
					<IconMingcuteEdit2Fill />
				</ContextMenu.Item>
			)}
			<ContextMenu.Divider />
			{data.type === ChannelType.DM && (
				<ContextMenu.Item label="Copy User ID" onClick={() => navigator.clipboard.writeText(data.recipientIds[0])}>
					<IconMingcuteIdcardFill />
				</ContextMenu.Item>
			)}
			<ContextMenu.Item label="Copy Channel ID" onClick={() => navigator.clipboard.writeText(data.id)}>
				<IconMingcuteIdcardFill />
			</ContextMenu.Item>
		</>
	);
}
