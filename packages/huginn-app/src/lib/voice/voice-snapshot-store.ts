import type { MediaSource, PopoutState } from "@/types";

import { VoiceClient } from "./voice-client";

export class VoiceSnapshotStore {
   private snapshot: { mediaSources: MediaSource[]; popoutState: PopoutState } = {
      mediaSources: [],
      popoutState: { isPopoutOpen: false, openMediaPopoutProducers: [] },
   };

   private listeners = new Set<() => void>();

   public constructor() {
      VoiceClient.listen("media_sources_updated", (sources) => this.setMediaSources(sources));
      VoiceClient.listen("popout_state_updated", (popoutState) => this.setPopoutWindows(popoutState));
   }

   public getSnapshot = () => {
      return this.snapshot;
   };

   public subscribe = (listener: () => void): (() => void) => {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
   };

   public setMediaSources(sources: MediaSource[]): void {
      this.snapshot = { ...this.snapshot, mediaSources: sources };
      for (const listener of this.listeners) listener();
   }

   public setPopoutWindows(state: PopoutState): void {
      this.snapshot = { ...this.snapshot, popoutState: state };
      for (const listener of this.listeners) listener();
   }

   public clear(): void {
      this.setMediaSources([]);
   }
}

export const voiceSnapshotStore = new VoiceSnapshotStore();
