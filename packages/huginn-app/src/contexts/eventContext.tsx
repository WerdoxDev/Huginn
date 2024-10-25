import type { APIUser, GatewayMessageCreateData } from "@huginn/shared";
import { type ReactNode, createContext } from "react";

type EventTypes = {
	message_added: { message: GatewayMessageCreateData; visible: boolean; self: boolean };
	user_updated: APIUser;
	image_cropper_done: { croppedImageData: string };
	open_url: string[];
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
	}, []);

	function listenEvent<K extends keyof EventTypes>(type: K, callback: (data: EventTypes[K]) => void) {
		const newListeners = { ...listeners.current };
		if (!newListeners[type]) {
			newListeners[type] = [];
		}
		newListeners[type].push(callback as (data: unknown) => void);

		listeners.current = newListeners;

		return () => {
			const newListeners = { ...listeners.current };
			if (newListeners[type]) {
				newListeners[type] = newListeners[type].filter((listener) => listener !== callback);
			}

			listeners.current = newListeners;
		};
	}

	return <EventContext.Provider value={{ dispatchEvent, listenEvent }}>{props.children}</EventContext.Provider>;
}

export function useEvent() {
	return useContext(EventContext);
}
