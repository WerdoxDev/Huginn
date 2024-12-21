import type { Snowflake } from "@huginn/shared";
import { type Dispatch, type ReactNode, type SetStateAction, createContext } from "react";

type ChannelMetaContextType = {
	savedScrolls: ReadonlyMap<Snowflake, number>;
	saveScroll: (channelId: Snowflake, scroll: number) => void;
	visibleMessages: { messageId: Snowflake; timestamp: number }[];
	setVisibleMessages: Dispatch<SetStateAction<{ messageId: Snowflake; timestamp: number }[]>>;
};

const ChannelMetaContext = createContext<ChannelMetaContextType>({} as ChannelMetaContextType);

export function ChannelMetaProvider(props: { children?: ReactNode }) {
	const savedScrolls = useRef<Map<Snowflake, number>>(new Map());
	const [visibleMessages, setVisibleMessages] = useState<{ messageId: Snowflake; timestamp: number }[]>([]);

	function saveScroll(channelId: Snowflake, scroll: number) {
		savedScrolls.current.set(channelId, scroll);
	}

	return (
		<ChannelMetaContext.Provider value={{ savedScrolls: savedScrolls.current, saveScroll, visibleMessages, setVisibleMessages }}>
			{props.children}
		</ChannelMetaContext.Provider>
	);
}

export function useChannelMeta() {
	return useContext(ChannelMetaContext);
}
