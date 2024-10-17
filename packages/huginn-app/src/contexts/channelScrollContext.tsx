import { type Dispatch, type ReactNode, createContext } from "react";

type ChannelScrollContextType = Map<string, number>;
type ChannelScrollDispatchType = { channelId: string; scroll: number };

const defaultValue: ChannelScrollContextType = new Map();

const ChannelScrollContext = createContext<ChannelScrollContextType>(defaultValue);
const ChannelScrollDispatchContext = createContext<Dispatch<ChannelScrollDispatchType>>(() => {});

export function ChannelScrollProvider(props: { children?: ReactNode }) {
	const [channelScroll, dispatch] = useReducer(channelScrollReducer, defaultValue);

	return (
		<ChannelScrollContext.Provider value={channelScroll}>
			<ChannelScrollDispatchContext.Provider value={dispatch}>{props.children}</ChannelScrollDispatchContext.Provider>
		</ChannelScrollContext.Provider>
	);
}

function channelScrollReducer(channelScroll: ChannelScrollContextType, action: { channelId: string; scroll: number }): ChannelScrollContextType {
	const channelScrollCopy = new Map(channelScroll);
	channelScrollCopy.set(action.channelId, action.scroll);
	return channelScrollCopy;
}

export function useChannelScroll() {
	return useContext(ChannelScrollContext);
}

export function useChannelScrollDispatch() {
	return useContext(ChannelScrollDispatchContext);
}
