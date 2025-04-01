import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

const store = createStore(combine({ state: 2 }, (set) => ({ setState: (state: number) => set({ state }) })));

export function useAuthBackground() {
	return useStore(store);
}
