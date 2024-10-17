export default function RelationshipContextMenu() {
	const { context, data, close } = useContextMenu("relationship");
	const removeMutation = useRemoveRelationship();
	const createMutation = useCreateDMChannel();

	if (!data) return;

	return (
		<ContextMenu close={close} isOpen={context?.isOpen} position={context?.position}>
			<ContextMenu.Item
				label="Message"
				onClick={() => {
					createMutation.mutate({ recipients: [data.user.id] });
				}}
			/>
			<ContextMenu.Item
				label="Remove friend"
				onClick={() => {
					removeMutation.mutate(data.user.id);
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
