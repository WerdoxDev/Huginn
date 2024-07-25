import { GatewayMessageCreateDispatchData } from "@huginn/shared";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

type EventTypes = {
   message_added: { message: GatewayMessageCreateDispatchData; visible: boolean; self: boolean };
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
   const [events, setEvents] = useState<EventType[]>([]);
   const [listeners, setListeners] = useState<Record<string, ((data: unknown) => void)[]>>({});

   const dispatchEvent = useCallback<EventContextType["dispatchEvent"]>((type, data) => {
      setEvents(prevEvents => [...prevEvents, { type, data }]);
   }, []);

   function listenEvent<K extends keyof EventTypes>(type: K, callback: (data: EventTypes[K]) => void) {
      setListeners(prevListeners => {
         const newListeners = { ...prevListeners };
         if (!newListeners[type]) {
            newListeners[type] = [];
         }
         newListeners[type].push(callback as (data: unknown) => void);
         return newListeners;
      });

      return () => {
         setListeners(prevListeners => {
            const newListeners = { ...prevListeners };
            if (newListeners[type]) {
               newListeners[type] = newListeners[type].filter(listener => listener !== callback);
            }
            return newListeners;
         });
      };
   }

   useEffect(() => {
      events.forEach(event => {
         const eventType = event.type;
         if (listeners[eventType]) {
            listeners[eventType].forEach(listener => listener(event.data));
         }
      });
      if (events.length !== 0) {
         setEvents([]);
      }
   }, [events, listeners]);

   return <EventContext.Provider value={{ dispatchEvent, listenEvent }}>{props.children}</EventContext.Provider>;
}

export function useEvent() {
   return useContext(EventContext);
}
