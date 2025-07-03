// biome-ignore lint/suspicious/noExplicitAny: required here
type EventCallback<T = any> = (data: T) => void;

export class EventEmitter<Events> {
   private events: { [event in keyof Events]?: EventCallback<Events[event]>[] } = {};
   // private queuedEvents: { [event in keyof Events]?: Events[event][] } = {}; // Cache for past events

   public on<EventName extends keyof Events>(
      eventName: EventName,
      handler: (eventArg: Events[EventName]) => void,
      // withoutHistory?: boolean,
   ): void {
      if (!this.events[eventName]) {
         this.events[eventName] = [];
      }
      this.events[eventName]?.push(handler);

      // if (withoutHistory) {
      //    this.queuedEvents[eventName] = [];
      // }
      // Process any queued events
      // else if (this.queuedEvents[eventName]) {
      //    for (const data of this.queuedEvents[eventName]) {
      //       handler(data);
      //    }

      //    this.queuedEvents[eventName] = []; // Clear the queue
      // }
   }

   public off<EventName extends keyof Events>(eventName: EventName, handler: (eventArg: Events[EventName]) => void): void {
      if (this.events[eventName]) {
         this.events[eventName] = this.events[eventName].filter((l) => l !== handler);
      }
   }

   public offAll<Eventname extends keyof Events>(eventName: Eventname): void {
      this.events[eventName] = [];
   }

   emit<EventName extends keyof Events>(eventName: EventName, eventArg: Events[EventName]): void {
      // Notify all listeners
      if (this.events[eventName] && this.events[eventName].length > 0) {
         for (const listener of this.events[eventName]) {
            listener(eventArg);
         }
      }
      // } else {
      //    // No listeners yet, so queue the event
      //    if (!this.queuedEvents[eventName]) {
      //       this.queuedEvents[eventName] = [];
      //    }
      //    this.queuedEvents[eventName].push(eventArg);
      // }
   }

   public listen<EventName extends keyof Events>(
      eventName: EventName,
      handler: (eventArg: Events[EventName]) => void,
      // withoutHistory?: boolean,
   ): () => void {
      this.on(eventName, handler);
      return () => this.off(eventName, handler);
   }
}
