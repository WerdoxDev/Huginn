import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useStartBackground = create(combine({ state: 2 }, (set) => ({ setState: (state: number) => set({ state }) })));
