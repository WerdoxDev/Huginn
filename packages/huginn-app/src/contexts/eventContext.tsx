import type { APIUser, GatewayMessageCreateData } from "@huginn/shared";
import { type ReactNode, createContext, useCallback, useContext, useEffect, useRef } from "react";

type EventTypes = {
	message_added: { message: GatewayMessageCreateData; visible: boolean; self: boolean };
	user_updated: { user: APIUser; self: boolean };
	image_cropper_done: { croppedImageData: string };
};

type EventType = { type: keyof EventTypes; data: EventTypes[keyof EventTypes] };

type EventContextType = {
	dispatchEvent<K extends keyof EventTypes>(type: K, data: EventTypes[K]): void;
	listenEvent<K extends keyof EventTypes>(type: K, callback: (data: EventTypes[K]) => void): () => void;
};

const EventContext = createContext<EventContextType>({
	dispatchEvent: (_type, _data) => {},
	listenEvent: (_type, _callback) => () => {},
});

export function EventProvider(props: { children?: ReactNode }) {
	const events = useRef<EventType[]>([]);
	const listeners = useRef<Record<string, ((data: unknown) => void)[]>>({});

	const dispatchEvent = useCallback<EventContextType["dispatchEvent"]>((type, data) => {
		events.current.push({ type, data });
		for (const event of events.current) {
			const eventType = event.type;
			if (listeners.current[eventType]) {
				for (const listener of listeners.current[eventType]) {
					listener(event.data);
				}
			}
		}
		events.current = [];
		// setEvents(prevEvents => [...prevEvents, { type, data }]);
	}, []);

	function listenEvent<K extends keyof EventTypes>(type: K, callback: (data: EventTypes[K]) => void) {
		// setListeners(prevListeners => {
		const newListeners = { ...listeners.current };
		if (!newListeners[type]) {
			newListeners[type] = [];
		}
		newListeners[type].push(callback as (data: unknown) => void);

		listeners.current = newListeners;
		// return newListeners;
		// });

		return () => {
			// setListeners(prevListeners => {
			const newListeners = { ...listeners.current };
			if (newListeners[type]) {
				newListeners[type] = newListeners[type].filter((listener) => listener !== callback);
			}

			listeners.current = newListeners;
			// return newListeners;
			// });
		};
	}

	useEffect(() => {
		// console.log("HI?");
		// if (events.current.length !== 0) {
		//    events.current = [];
		//    // setEvents([]);
		// }
	}, [events, listeners]);

	return <EventContext.Provider value={{ dispatchEvent, listenEvent }}>{props.children}</EventContext.Provider>;
}

export function useEvent() {
	return useContext(EventContext);
}
