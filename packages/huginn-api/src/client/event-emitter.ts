// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type EventCallback<T = any> = (data: T) => void;

export class EventEmitterWithHistory {
	private events: { [event: string]: EventCallback[] } = {};
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	private history: { [event: string]: any[] } = {}; // Cache for past events

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	on<T = any>(event: string, listener: EventCallback<T>): void {
		if (!this.events[event]) {
			this.events[event] = [];
		}
		this.events[event].push(listener);

		// Replay the history for the new listener
		if (this.history[event]) {
			for (const data of this.history[event]) {
				listener(data);
			}
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	off<T = any>(event: string, listener: EventCallback<T>): void {
		if (this.events[event]) {
			this.events[event] = this.events[event].filter((l) => l !== listener);
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	emit<T = any>(event: string, data: T): void {
		// Cache the event data
		if (!this.history[event]) {
			this.history[event] = [];
		}
		this.history[event].push(data);

		// Notify all listeners
		if (this.events[event]) {
			for (const listener of this.events[event]) {
				listener(data);
			}
		}
	}
}
