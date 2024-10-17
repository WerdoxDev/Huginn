import type { ContextMenuDMChannel, ContextMenuDMChannelRecipient, ContextMenuRelationship, ContextMenuStateProps } from "@/types";
import { type Dispatch, type MouseEvent, type ReactNode, createContext } from "react";

type ContextMenuContextType = {
	dm_channel?: ContextMenuStateProps<ContextMenuDMChannel>;
	dm_channel_recipient?: ContextMenuStateProps<ContextMenuDMChannelRecipient>;
	relationship_more?: ContextMenuStateProps<ContextMenuRelationship>;
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

export function useContextMenu<T extends keyof ContextMenuContextType>(type: T) {
	const context = useContext(ContextMenuContext);
	const dispatch = useContext(ContextMenuDispatchContext);

	const data = useMemo(() => context[type]?.contextData, [context[type]]);

	function open(data: Required<ContextMenuContextType>[T]["contextData"], e: MouseEvent<HTMLElement>) {
		e.preventDefault();
		dispatch({ [type]: { isOpen: true, contextData: data, position: [e.clientX, e.clientY] } });
	}

	function close() {
		dispatch({ [type]: { isOpen: false } });
	}

	return {
		open,
		close,
		context: context[type] as ContextMenuContextType[T],
		data: data as Required<ContextMenuContextType>[T]["contextData"],
	};
}

export function useContextMenuDispatch() {
	return useContext(ContextMenuDispatchContext);
}
