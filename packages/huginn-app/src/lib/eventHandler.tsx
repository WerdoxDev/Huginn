import type { AppMessage } from "@/types";
import type { APIUser } from "@huginn/shared";
import { createContext } from "react";

type EventTypes = {
	message_added: { message: AppMessage; inLoadedQueryPage: boolean; inVisibleQueryPage: boolean; visible: boolean; self: boolean };
	message_updated: { message: AppMessage; inLoadedQueryPage: boolean; inVisibleQueryPage: boolean; visible: boolean; self: boolean };
	user_updated: APIUser;
	image_cropper_done: { croppedImageData: string };
	deep_link: string;
	message_box_height_changed: { difference: number };
};

type EventType = { type: keyof EventTypes; data: EventTypes[keyof EventTypes] };

type EventContextType = {
	dispatchEvent<K extends keyof EventTypes>(type: K, data: EventTypes[K]): void;
	listenEvent<K extends keyof EventTypes>(type: K, callback: (data: EventTypes[K]) => void): () => void;
};

const EventContext = createContext<EventContextType>({} as EventContextType);

// export function EventProvider(props: { children?: ReactNode }) {
let events: EventType[] = [];
let listeners: Record<string, ((data: unknown) => void)[]> = {};

export const dispatchEvent: EventContextType["dispatchEvent"] = (type, data) => {
	events.push({ type, data });
	for (const event of events) {
		const eventType = event.type;
		if (listeners[eventType]) {
			for (const listener of listeners[eventType]) {
				listener(event.data);
			}
		}
	}
	events = [];
};

export function listenEvent<K extends keyof EventTypes>(type: K, callback: (data: EventTypes[K]) => void) {
	const newListeners = { ...listeners };
	if (!newListeners[type]) {
		newListeners[type] = [];
	}
	newListeners[type].push(callback as (data: unknown) => void);

	listeners = newListeners;

	return () => {
		const newListeners = { ...listeners };
		if (newListeners[type]) {
			newListeners[type] = newListeners[type].filter((listener) => listener !== callback);
		}

		listeners = newListeners;
	};
}

// return <EventContext.Provider value={{ dispatchEvent, listenEvent }}>{props.children}</EventContext.Provider>;
// }

// export function useEvent() {
// 	return useContext(EventContext);
// }
