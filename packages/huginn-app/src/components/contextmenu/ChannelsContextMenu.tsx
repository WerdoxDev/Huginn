import { type ContextMenuDMChannel, ContextMenuType } from "@/types";
import { useContextMenu } from "@contexts/contextMenuContext";
import { useUser } from "@contexts/userContext";
import { useDeleteDMChannel } from "@hooks/mutations/useDeleteDMChannel";
import { ChannelType } from "@huginn/shared";
import { useMemo } from "react";
import { ContextMenu } from "./ContextMenu";

export function ChannelsContextMenu() {
	const { context, close } = useContextMenu<ContextMenuDMChannel>(ContextMenuType.DM_CHANNEL);
	const deleteChannelMutation = useDeleteDMChannel();
	const { user } = useUser();

	const data = useMemo(() => context?.contextData, [context]);
	if (!data) return;

	return (
		<ContextMenu close={close} isOpen={context.isOpen} position={context.position}>
			<ContextMenu.Item
				label={data.type === ChannelType.DM ? "Close DM" : "Leave Group"}
				onClick={() => {
					deleteChannelMutation.mutate(data.id);
				}}
				className="!text-error focus:!bg-error/80 focus:!text-white"
			/>
			<ContextMenu.Divider />
			{data.type === ChannelType.DM && (
				<ContextMenu.Item label="Copy User ID" onClick={() => navigator.clipboard.writeText(data.recipients[0].id)}>
					<IconMdiIdentificationCard />
				</ContextMenu.Item>
			)}
			<ContextMenu.Item label="Copy Channel ID" onClick={() => navigator.clipboard.writeText(data.id)}>
				<IconMdiIdentificationCard />
			</ContextMenu.Item>
		</ContextMenu>
	);
}
