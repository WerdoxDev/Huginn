import type { GatewayBatchPresenceUpdateData, GatewayPresenceUpdateData, Snowflake } from "@huginn/shared";
import { useQueryClient } from "@tanstack/react-query";
import { type Dispatch, type ReactNode, act, createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { useClient } from "./apiContext";

type PresenceContextType = GatewayPresenceUpdateData[];

const defaultValue: PresenceContextType = [];

const PresenceContext = createContext<PresenceContextType>(defaultValue);
const PresenceDispatchContext = createContext<Dispatch<PresenceContextType>>(() => {});

export function PresenceProvider(props: { children?: ReactNode }) {
	const [presences, dispatch] = useReducer(presencesReducer, defaultValue);
	const client = useClient();

	function onPresenceUpdated(d: GatewayPresenceUpdateData | GatewayBatchPresenceUpdateData) {
		dispatch(d);
	}

	useEffect(() => {
		client.gateway.on("presence_update", onPresenceUpdated);
		client.gateway.on("batch_presence_update", onPresenceUpdated);

		return () => {
			client.gateway.off("presence_update", onPresenceUpdated);
			client.gateway.off("batch_presence_update", onPresenceUpdated);
		};
	}, []);

	return (
		<PresenceContext.Provider value={presences}>
			<PresenceDispatchContext.Provider value={dispatch}>{props.children}</PresenceDispatchContext.Provider>
		</PresenceContext.Provider>
	);
}

function presencesReducer(presences: PresenceContextType, action: GatewayPresenceUpdateData | GatewayBatchPresenceUpdateData): PresenceContextType {
	const copy = structuredClone(presences);
	const actions = Array.isArray(action) ? action : [action];

	for (const presence of actions) {
		console.log(presence);
		const index = copy.findIndex((x) => x.user.id === presence.user.id);
		if (index === -1) {
			copy.push(presence);
		} else {
			copy[index] = presence;
		}
	}

	return copy;
}

export function usePresence(userId: Snowflake) {
	const context = useContext(PresenceContext);

	return useMemo(() => context.find((x) => x.user.id === userId), [context]);
}
