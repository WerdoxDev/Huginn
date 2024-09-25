import { type ContextMenuRelationship, ContextMenuType } from "@/types";
import { useContextMenu } from "@contexts/contextMenuContext";
import { useRemoveFriend } from "@hooks/mutations/useRemoveFriend";
import { useMemo } from "react";
import { ContextMenu } from "./ContextMenu";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";

export default function RelationshipContextMenu() {
	const { context, close } = useContextMenu<ContextMenuRelationship>(ContextMenuType.RELATIONSHIP);
	const removeFriendMutation = useRemoveFriend();
	const createDMMutation = useCreateDMChannel();

	const data = useMemo(() => context?.contextData, [context]);
	if (!data) return;

	return (
		<ContextMenu close={close} isOpen={context.isOpen} position={context.position}>
			<ContextMenu.Item
				label="Message"
				onClick={() => {
					createDMMutation.mutate({ recipients: [data.user.id] });
				}}
			/>
			<ContextMenu.Item
				label="Remove friend"
				onClick={() => {
					removeFriendMutation.mutate(data.user.id);
				}}
				className="!text-error focus:!bg-error/80 focus:!text-white"
			/>
			<ContextMenu.Divider />
			<ContextMenu.Item label="Copy User ID">
				<IconMdiIdentificationCard />
			</ContextMenu.Item>
		</ContextMenu>
	);
}
