// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type EventCallback<T = any> = (data: T) => void;

export class EventEmitterWithHistory {
	private events: { [event: string]: EventCallback[] } = {};
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	private queuedEvents: { [event: string]: any[] } = {}; // Cache for past events

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	on<T = any>(event: string, listener: EventCallback<T>): void {
		if (!this.events[event]) {
			this.events[event] = [];
		}
		this.events[event].push(listener);

		// console.log(this.queuedEvents[event]);
		// Process any queued events
		if (this.queuedEvents[event]) {
			for (const data of this.queuedEvents[event]) {
				listener(data);
			}

			this.queuedEvents[event] = []; // Clear the queue
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
		// Notify all listeners
		if (this.events[event] && this.events[event].length > 0) {
			for (const listener of this.events[event]) {
				listener(data);
			}
		} else {
			// No listeners yet, so queue the event
			if (!this.queuedEvents[event]) {
				this.queuedEvents[event] = [];
			}
			this.queuedEvents[event].push(data);
		}
	}
}
