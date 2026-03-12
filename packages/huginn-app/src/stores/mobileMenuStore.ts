import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useMobileMenuStore = create(
   combine(
      {
         isLeftOpen: false,
         isRightOpen: false,

         leftOffset: 0,
         leftMenuWidth: 320,
         rightMenuWidth: 240,
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
               leftOffset: state.leftMenuWidth,
            })),
         closeLeft: () => set({ isLeftOpen: false, leftOffset: 0 }),

         openRight: () => set({ isLeftOpen: false, isRightOpen: true }),
         closeRight: () => set({ isRightOpen: false }),
         toggleRight: () => set((state) => ({ isRightOpen: !state.isRightOpen })),
      }),
   ),
);
