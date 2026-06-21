import { App } from "@capacitor/app";
// hooks/useBackButtonManager.ts
import { useEffect } from "react";

type BackHandler = {
   id: string;
   priority: number;
   handler: () => boolean | void; // return true to consume the event
};

const handlers: BackHandler[] = [];
let listenerRegistered = false;

function sortHandlers() {
   handlers.sort((a, b) => b.priority - a.priority);
}

function runHandlers() {
   let consumed = false;
   for (const { handler } of handlers) {
      const result = handler();
      if (result === true) {
         consumed = true;
         break;
      }
   }

   if (!consumed) {
      App.exitApp();
   }
}

export function registerBackHandler(id: string, priority: number, handler: () => boolean | void) {
   handlers.push({ id, priority, handler });
   sortHandlers();
}

export function unregisterBackHandler(id: string) {
   const idx = handlers.findIndex((h) => h.id === id);
   if (idx !== -1) handlers.splice(idx, 1);
}

export function useBackButtonManager() {
   useEffect(() => {
      if (listenerRegistered) return;
      listenerRegistered = true;

      App.addListener("backButton", runHandlers);

      return () => {
         App.removeAllListeners();
         listenerRegistered = false;
      };
   }, []);
}
