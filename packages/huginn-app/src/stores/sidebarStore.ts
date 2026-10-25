import { create } from "zustand";
import { combine } from "zustand/middleware";

import type { ChannelSidebarPanel } from "@/types";

export const useSidebarStore = create(
   combine(
      {
         isLeftOpen: false,
         isRightOpen: false,
         rightPanel: "members" as ChannelSidebarPanel,

         leftOffset: 0,
         leftSidebarWidth: 320,
         isDragging: false,
      },
      (set) => ({
         setIsDragging: (isDragging: boolean) => set({ isDragging }),
         setLeftOffset: (offset: number) => set({ leftOffset: offset }),

         resetToCenter: () => set({ isLeftOpen: false, isRightOpen: false, leftOffset: 0 }),

         openLeft: () =>
            set((state) => ({
               isLeftOpen: true,
               isRightOpen: false,
               leftOffset: state.leftSidebarWidth,
            })),
         closeLeft: () => set({ isLeftOpen: false, leftOffset: 0 }),

         openRight: (panel?: ChannelSidebarPanel) =>
            set((state) => ({ isLeftOpen: false, leftOffset: 0, isRightOpen: true, rightPanel: panel ?? state.rightPanel })),
         closeRight: () => set({ isRightOpen: false }),
         toggleRight: (panel: ChannelSidebarPanel = "members") =>
            set((state) => ({
               isLeftOpen: false,
               leftOffset: 0,
               isRightOpen: !state.isRightOpen || state.rightPanel !== panel,
               rightPanel: panel,
            })),
      }),
   ),
);
