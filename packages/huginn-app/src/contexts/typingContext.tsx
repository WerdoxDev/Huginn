import type { GatewayTypingStartData, Snowflake } from "@huginn/shared";
import { type ReactNode, createContext } from "react";

type TypingContextType = { removeTyping: (userId: Snowflake, channelId: Snowflake) => void; typings: GatewayTypingStartData[] };
const defaultValue: TypingContextType = { removeTyping: (_) => {}, typings: [] };
const TypingContext = createContext<TypingContextType>(defaultValue);

export function TypyingProvider(props: { children?: ReactNode }) {
	const [typings, setTypings] = useState<GatewayTypingStartData[]>([]);
	const timeouts = useRef<{ userId: Snowflake; channelId: Snowflake; timeout: number }[]>([]);
	const client = useClient();

	function onTypingStart(d: GatewayTypingStartData) {
		setTypings((prev) => {
			const existingIndex = prev.findIndex((x) => x.userId === d.userId);
			return existingIndex !== -1
				? prev.map((x, i) => {
						if (i === existingIndex) {
							const timeoutIndex = timeouts.current.findIndex((x) => x.userId === d.userId);
							clearTimeout(timeouts.current[timeoutIndex].timeout);
							const newTimeout = startTimeout(d.userId, d.channelId);
							timeouts.current = [...timeouts.current.with(timeoutIndex, { timeout: newTimeout, userId: d.userId, channelId: d.channelId })];
							return { ...x, ...d };
						}

						return x;
					})
				: (() => {
						const timeout = startTimeout(d.userId, d.channelId);
						timeouts.current = [...timeouts.current, { userId: d.userId, timeout, channelId: d.channelId }];
						return [...prev, d];
					})();
		});
	}

	function startTimeout(userId: Snowflake, channelId: Snowflake) {
		return window.setTimeout(() => {
			removeTyping(userId, channelId);
		}, 10000);
	}

	function removeTyping(userId: Snowflake, channelId: Snowflake) {
		setTypings((prev) => prev.filter((x) => x.userId !== userId));
		timeouts.current = [...timeouts.current.filter((x) => x.userId !== userId && x.channelId !== channelId)];
	}

	useEffect(() => {
		client.gateway.on("typying_start", onTypingStart);

		return () => {
			client.gateway.off("typying_start", onTypingStart);
		};
	}, []);

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
