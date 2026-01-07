import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useMobileMenuStore = create(
   combine(
      {
         currentPanel: "center" as "left" | "center" | "right",
         leftOffset: 0,
         rightOffset: 0,
         leftMenuWidth: 320,
         rightMenuWidth: 222,
      },
      (set) => ({
         setCurrentPanel: (panel: "left" | "center" | "right") => set({ currentPanel: panel }),
         setLeftOffset: (offset: number) => set({ leftOffset: offset }),
         setRightOffset: (offset: number) => set({ rightOffset: offset }),
         resetToCenter: () => set({ currentPanel: "center", leftOffset: 0, rightOffset: 0 }),
         openLeft: () => set((state) => ({ currentPanel: "left", leftOffset: state.leftMenuWidth })),
         openRight: () => set((state) => ({ currentPanel: "right", rightOffset: state.rightMenuWidth })),
         toggleRight: () =>
            set((state) => ({
               currentPanel: state.currentPanel === "right" ? "center" : "right",
               rightOffset: state.currentPanel === "right" ? 0 : state.rightMenuWidth,
            })),
      }),
   ),
);
