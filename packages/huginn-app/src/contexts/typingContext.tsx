import type { GatewayTypingStartData, Snowflake } from "@huginn/shared";
import { type ReactNode, createContext } from "react";

type TypingContextType = { removeTyping: (userId: Snowflake, channelId: Snowflake) => void; typings: GatewayTypingStartData[] };
const TypingContext = createContext<TypingContextType>({} as TypingContextType);

export function TypingProvider(props: { children?: ReactNode }) {
	const client = useClient();
	const { listenEvent } = useEvent();
	const [typings, setTypings] = useState<(GatewayTypingStartData & { timeout: number })[]>([]);
	// React state does not work in setTimeout. So this is a replica of the state
	const _typings = useRef<(GatewayTypingStartData & { timeout: number })[]>([]);

	function onTypingStart(d: GatewayTypingStartData) {
		setTypings(() => {
			const existingIndex = _typings.current.findIndex((x) => x.userId === d.userId && x.channelId === d.channelId);
			return existingIndex !== -1
				? _typings.current.map((x, i) => {
						if (i === existingIndex) {
							window.clearTimeout(x.timeout);
							const newTimeout = startTimeout(d.userId, d.channelId);
							return { ...x, ...d, timeout: newTimeout };
						}

						return x;
					})
				: [..._typings.current, { ...d, timeout: startTimeout(d.userId, d.channelId) }];
		});
	}

	function startTimeout(userId: Snowflake, channelId: Snowflake) {
		const id = window.setTimeout(() => {
			removeTyping(userId, channelId);
		}, 10000);
		return id;
	}

	function removeTyping(userId: Snowflake, channelId: Snowflake) {
		const foundId = _typings.current.find((x) => x.userId === userId && x.channelId === channelId)?.timeout;
		window.clearTimeout(foundId);
		setTypings(() => _typings.current.filter((x) => x.userId !== userId && x.channelId !== channelId));
	}

	useEffect(() => {
		const unlisten = listenEvent("message_added", (data) => {
			removeTyping(data.message.author.id, data.message.channelId);
		});

		client.gateway.on("typying_start", onTypingStart);

		return () => {
			unlisten();
			client.gateway.off("typying_start", onTypingStart);
		};
	}, []);

	useEffect(() => {
		_typings.current = typings;
	}, [typings]);

	return <TypingContext.Provider value={{ typings, removeTyping }}>{props.children}</TypingContext.Provider>;
}

export function useTyping(userId: Snowflake) {
	const context = useContext(TypingContext);
	const typings = useMemo(() => context.typings.find((x) => x.userId === userId), [context]);

	return { removeTimeout: context.removeTyping, typings };
}

export function useTypings() {
	return useContext(TypingContext);
}
