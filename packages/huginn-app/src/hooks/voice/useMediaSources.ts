import { voiceSnapshotStore } from "@lib/voice/voice-snapshot-store";
import { useSyncExternalStore } from "react";

export function useVoiceSnapshot() {
   return useSyncExternalStore(voiceSnapshotStore.subscribe, voiceSnapshotStore.getSnapshot, voiceSnapshotStore.getSnapshot);
}
