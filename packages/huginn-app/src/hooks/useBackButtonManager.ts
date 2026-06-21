import { App } from "@capacitor/app";
// hooks/useBackButtonManager.ts
import { useEffect } from "react";

type BackHandler = {
   id: string;
   priority: number;
   placement: "after-stack" | "before-stack" | "stack";
   handler: () => boolean | void;
};

const afterStackHandlers: BackHandler[] = [];
const beforeStackHandlers: BackHandler[] = [];
const stackHandlers: BackHandler[] = [];
let listenerRegistered = false;

function runHandlers() {
   for (const { handler } of beforeStackHandlers) {
      const consumed = handler();
      if (consumed) return;
   }

   if (stackHandlers.length > 0) {
      const top = stackHandlers[stackHandlers.length - 1];
      top.handler();
      return;
   }

   for (const { handler } of afterStackHandlers) {
      const consumed = handler();
      if (consumed) return;
   }
}

export function registerBackHandler(id: string, priority: number, placement: "after-stack" | "before-stack", handler: () => boolean | void) {
   if (placement === "after-stack") {
      afterStackHandlers.push({ id, priority, handler, placement });
      afterStackHandlers.sort((a, b) => b.priority - a.priority);
   } else if (placement === "before-stack") {
      beforeStackHandlers.push({ id, priority, handler, placement });
      beforeStackHandlers.sort((a, b) => b.priority - a.priority);
   }
}

export function unregisterBackHandler(id: string) {
   const beforeIdx = beforeStackHandlers.findIndex((h) => h.id === id);
   if (beforeIdx !== -1) beforeStackHandlers.splice(beforeIdx, 1);

   const afterIdx = afterStackHandlers.findIndex((h) => h.id === id);
   if (afterIdx !== -1) afterStackHandlers.splice(afterIdx, 1);
}

export function pushStackHandler(id: string, handler: () => void) {
   stackHandlers.push({ id, priority: 0, handler, placement: "stack" });
}

export function popStackHandler(id: string) {
   const idx = stackHandlers.findLastIndex((h) => h.id === id);
   if (idx !== -1) stackHandlers.splice(idx, 1);
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
