import type { Snowflake } from "@huginn/shared";
import { type Dispatch, type ReactNode, type SetStateAction, createContext } from "react";

type ChannelsInfoContextType = {
	savedScrolls: ReadonlyMap<Snowflake, number>;
	saveScroll: (channelId: Snowflake, scroll: number) => void;
	currentVisibleMessages: { messageId: Snowflake; messageTimestamp: number; channelId: Snowflake }[];
	setCurrentVisibleMessages: Dispatch<SetStateAction<{ messageId: Snowflake; messageTimestamp: number; channelId: Snowflake }[]>>;
};

const ChannelsInfoContext = createContext<ChannelsInfoContextType>({} as ChannelsInfoContextType);

export function ChannelsInfoProvider(props: { children?: ReactNode }) {
	const savedScrolls = useRef<Map<Snowflake, number>>(new Map());
	const [currentVisibleMessages, setCurrentVisibleMessages] = useState<{ messageId: Snowflake; messageTimestamp: number; channelId: Snowflake }[]>(
		[],
	);

	function saveScroll(channelId: Snowflake, scroll: number) {
		savedScrolls.current.set(channelId, scroll);
	}

	return (
		<ChannelsInfoContext.Provider value={{ savedScrolls: savedScrolls.current, saveScroll, currentVisibleMessages, setCurrentVisibleMessages }}>
			{props.children}
		</ChannelsInfoContext.Provider>
	);
}

export function useChannelsInfo() {
	return useContext(ChannelsInfoContext);
}
