import { ErrorBoundary } from "react-error-boundary";

const ChannelsContextMenu = lazy(() => import("./ChannelsContextMenu"));
const ChannelRecipientContextMenu = lazy(() => import("./ChannelRecipientContextMenu"));
const RelationshipContextMenu = lazy(() => import("./RelationshipContextMenu"));
const RelationshipMoreContextMenu = lazy(() => import("./RelationshipMoreContextMenu"));

export default function ContextMenusRenderer() {
	const { user } = useUser();

	const { context: dm_channel_context, close: dm_channel_close } = useContextMenu("dm_channel");
	const { context: dm_channel_recipient_context, close: dm_channel_recipient_close } = useContextMenu("dm_channel_recipient");
	const { context: relationship_context, close: relationship_close } = useContextMenu("relationship");
	const { context: relationship_more_context, close: relationship_more_close } = useContextMenu("relationship_more");

	return (
		<ErrorBoundary FallbackComponent={ModalErrorComponent}>
			{user && (
				<>
					<ContextMenu
						renderChildren={<ChannelsContextMenu />}
						close={dm_channel_close}
						isOpen={dm_channel_context?.isOpen}
						position={dm_channel_context?.position}
					/>
					<ContextMenu
						renderChildren={<ChannelRecipientContextMenu />}
						close={dm_channel_recipient_close}
						isOpen={dm_channel_recipient_context?.isOpen}
						position={dm_channel_recipient_context?.position}
					/>

					<ContextMenu
						renderChildren={<RelationshipContextMenu />}
						close={relationship_close}
						isOpen={relationship_context?.isOpen}
						position={relationship_context?.position}
					/>

					<ContextMenu
						renderChildren={<RelationshipMoreContextMenu />}
						close={relationship_more_close}
						isOpen={relationship_more_context?.isOpen}
						position={relationship_more_context?.position}
					/>
				</>
			)}
		</ErrorBoundary>
	);
}
