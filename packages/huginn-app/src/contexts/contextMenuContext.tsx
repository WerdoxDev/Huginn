import { type ContextMenuDMChannel, type ContextMenuRelationship, type ContextMenuStateProps, ContextMenuType } from "@/types";
import { type Dispatch, type MouseEvent, type ReactNode, createContext, useContext, useReducer } from "react";

type ContextMenuContextType = {
	dmChannel?: ContextMenuStateProps<ContextMenuDMChannel>;
	relationshipMore?: ContextMenuStateProps<ContextMenuRelationship>;
	relationship?: ContextMenuStateProps<ContextMenuRelationship>;
};

const ContextMenuContext = createContext<ContextMenuContextType>({});
const ContextMenuDispatchContext = createContext<Dispatch<ContextMenuContextType>>(() => {});

export function ContextMenuProvider(props: { children?: ReactNode }) {
	const [contextMenus, dispatch] = useReducer(contextMenusReducer, {});
	return (
		<ContextMenuContext.Provider value={contextMenus}>
			<ContextMenuDispatchContext.Provider value={dispatch}>{props.children}</ContextMenuDispatchContext.Provider>
		</ContextMenuContext.Provider>
	);
}

function contextMenusReducer(contextMenus: ContextMenuContextType, action: ContextMenuContextType): ContextMenuContextType {
	return { ...contextMenus, ...action };
}

// export function useChannelContextMenu() {
//    const dispatch = useContext(ContextMenuDispatchContext);

//    function open(channel: APIDMChannel | APIGroupDMChannel, e: MouseEvent) {
//       e.preventDefault();
//       dispatch({ dmChannel: { isOpen: true, data: channel, position: [e.clientX, e.clientY] } });
//    }

//    return open;
// }

// export function useRelationshipMoreContextMenu() {
//    const dispatch = useContext(ContextMenuDispatchContext);

//    function open(user: APIRelationUser, type: RelationshipType, e: MouseEvent) {
//       e.preventDefault();
//       dispatch({ relationshipMore: { isOpen: true, data: { user, type }, position: [e.clientX, e.clientY] } });
//    }

//    return open;
// }

//const onContextMenu = useContextMenu("channels");

//

export function useContextMenu<T = unknown>(type: ContextMenuType) {
	const context = useContext(ContextMenuContext);
	const dispatch = useContext(ContextMenuDispatchContext);

	let keyName: keyof ContextMenuContextType;

	switch (type) {
		case ContextMenuType.DM_CHANNEL:
			keyName = "dmChannel";
			break;
		case ContextMenuType.RELATIONSHIP_MORE:
			keyName = "relationshipMore";
			break;
		case ContextMenuType.RELATIONSHIP:
			keyName = "relationship";
			break;
	}

	function open(data: ContextMenuStateProps<T>["contextData"], e: MouseEvent) {
		e.preventDefault();
		dispatch({ [keyName]: { isOpen: true, contextData: data, position: [e.clientX, e.clientY] } });
	}

	function close() {
		dispatch({ [keyName]: { isOpen: false } });
	}

	return { open, close, context: context[keyName] as ContextMenuStateProps<T> };
}

export function useContextMenuDispatch() {
	return useContext(ContextMenuDispatchContext);
}
