// sync-zustand-store.ts
import type { StoreApi } from "zustand";

import { shallow } from "zustand/shallow";

import { getHostId } from "./child-window";

type SyncMessage<T> =
   | {
        type: "request-state";
        source: string;
     }
   | {
        type: "state";
        source: string;
        state: T;
     };

interface SyncStoreOptions<TState, TSynced extends object> {
   name: string;
   partialize: (state: TState) => TSynced;
}

export function syncZustandStore<TState extends object, TSynced extends object>(
   store: StoreApi<TState>,
   options: SyncStoreOptions<TState, TSynced>,
): () => void {
   if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
      return () => {};
   }

   const source = crypto.randomUUID();
   const channel = new BroadcastChannel(`zustand:${getHostId()}:${options.name}`);
   const isMainWindow = window.opener === null;

   let lastSyncedState = options.partialize(store.getState());

   const publishState = () => {
      channel.postMessage({
         type: "state",
         source,
         state: lastSyncedState,
      } satisfies SyncMessage<TSynced>);
   };

   const unsubscribe = isMainWindow
      ? store.subscribe((state) => {
           const nextSyncedState = options.partialize(state);

           // Avoid broadcasting when only an unsynchronized field changed.
           if (shallow(lastSyncedState, nextSyncedState)) {
              return;
           }

           lastSyncedState = nextSyncedState;
           publishState();
        })
      : () => {};

   channel.onmessage = (event: MessageEvent<SyncMessage<TSynced>>) => {
      const message = event.data;

      if (!message || message.source === source) {
         return;
      }

      if (message.type === "request-state") {
         if (isMainWindow) {
            publishState();
         }

         return;
      }

      // The main window is the sole publisher and never applies remote state.
      if (isMainWindow) {
         return;
      }

      lastSyncedState = message.state;

      // Zustand merges partial state by default, preserving actions.
      store.setState(message.state as Partial<TState>);
   };

   if (!isMainWindow) {
      // Ask the main window for its current state.
      channel.postMessage({
         type: "request-state",
         source,
      } satisfies SyncMessage<TSynced>);
   }

   return () => {
      unsubscribe();
      channel.close();
   };
}
