import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import { settingsStore } from "./settingsStore";

const initialStore = () => ({
	inputDeviceId: "",
	outputDeviceId: "",
});

const store = createStore(combine(initialStore(), (set) => ({})));

// function initializeAudio(){
//    settingsStore.subscribe()
// }

export function useAudioStore() {
	return useStore(store);
}
