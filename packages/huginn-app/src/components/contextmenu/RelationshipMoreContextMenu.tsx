import { useContextMenu } from "@contexts/contextMenuContext";
import { useRemoveRelationship } from "@hooks/mutations/useRemoveRelationship";
import { ContextMenu } from "./ContextMenu";

export default function RelationshipMoreContextMenu() {
	const { context, data, close } = useContextMenu("relationship_more");
	const removeMutation = useRemoveRelationship();

	if (!data) return;

	return (
		<ContextMenu close={close} isOpen={context?.isOpen} position={context?.position}>
			<ContextMenu.Item
				label="Remove friend"
				onClick={() => {
					removeMutation.mutate(data.user.id);
				}}
				className="!text-error focus:!bg-error/80 focus:!text-white"
			/>
		</ContextMenu>
	);
}
