import { type ContextMenuRelationship, ContextMenuType } from "@/types";
import { useContextMenu } from "@contexts/contextMenuContext";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { useRemoveFriend } from "@hooks/mutations/useRemoveFriend";
import { useMutationState } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { ContextMenu } from "./ContextMenu";

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
			<ContextMenu.Item label="Copy User ID" onClick={() => navigator.clipboard.writeText(data.user.id)}>
				<IconMdiIdentificationCard />
			</ContextMenu.Item>
		</ContextMenu>
	);
}
