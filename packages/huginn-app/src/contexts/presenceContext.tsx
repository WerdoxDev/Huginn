import type { GatewayPresenceUpdateData, GatewayReadyData, Snowflake } from "@huginn/shared";
import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { useClient } from "./apiContext";

type PresenceContextType = GatewayPresenceUpdateData[];
const defaultValue: PresenceContextType = [];
const PresenceContext = createContext<PresenceContextType>(defaultValue);

export function PresenceProvider(props: { children?: ReactNode }) {
	const [presences, setPresences] = useState<PresenceContextType>(defaultValue);
	const client = useClient();

	function onPresenceUpdated(d: GatewayPresenceUpdateData) {
		if (d.status === "offline") {
			setPresences((prev) => prev.filter((x) => x.user.id !== d.user.id));
			return;
		}

		setPresences((prev) => {
			const existingIndex = prev.findIndex((x) => x.user.id === d.user.id);
			return existingIndex !== -1
				? prev.map((x, i) => {
						if (i === existingIndex) {
							return { ...x, ...d };
						}

						return x;
					})
				: [...prev, d];
		});
	}

	function onReady(d: GatewayReadyData) {
		setPresences([]);
		onPresenceUpdated({ user: d.user, status: client.gateway.readyData?.userSettings?.status || "offline" });

		if (d.presences) {
			for (const presence of d.presences) {
				onPresenceUpdated(presence);
			}
		}
	}

	useEffect(() => {
		client.gateway.on("ready", onReady);
		client.gateway.on("presence_update", onPresenceUpdated);

		return () => {
			client.gateway.off("ready", onReady);
			client.gateway.off("presence_update", onPresenceUpdated);
		};
	}, []);

	return <PresenceContext.Provider value={presences}>{props.children}</PresenceContext.Provider>;
}

export function usePresence(userId: Snowflake) {
	const context = useContext(PresenceContext);

	return useMemo(() => context.find((x) => x.user.id === userId), [context]);
}

export function usePresences(userIds: Snowflake[]) {
	const context = useContext(PresenceContext);
	const presences = useMemo(() => context.filter((x) => userIds.includes(x.user.id)), [context]);

	function getPresence(userId: Snowflake) {
		return presences.find((x) => x.user.id === userId);
	}

	return { presences, getPresence };
}
