import type { Snowflake } from "@huginnjs/shared";

import { VoiceClient } from "@lib/voice/voice-client";
import { voiceSnapshotStore } from "@lib/voice/voice-snapshot-store";
import { getVoiceHostId, isVoiceChildWindow } from "@lib/voice/voice-window";
import { initializeClient } from "@stores/clientStore";
import { useEffect, useState } from "react";

type VoicePopoutState = {
   channelId: Snowflake | null;
   error: string | null;
   isReady: boolean;
};

export function useVoicePopoutBootstrap(): VoicePopoutState {
   const [state, setState] = useState<VoicePopoutState>({ channelId: null, error: null, isReady: false });

   useEffect(() => {
      let cancelled = false;

      async function initialize() {
         try {
            if (!isVoiceChildWindow()) throw new Error("This voice popout is not attached to a host window");

            VoiceClient.configure(getVoiceHostId());
            const snapshot = await VoiceClient.sendMessage("get_snapshot");
            if (!snapshot.connection) throw new Error("The host window is not connected to voice");

            voiceSnapshotStore.setMediaSources(snapshot.mediaSources);
            voiceSnapshotStore.setPopoutWindows(snapshot.popoutState);
            await initializeClient();

            if (!cancelled) setState({ channelId: snapshot.connection.channelId, error: null, isReady: true });
         } catch (reason) {
            if (!cancelled) {
               setState({ channelId: null, error: reason instanceof Error ? reason.message : String(reason), isReady: true });
            }
         }
      }

      void initialize();
      return () => {
         cancelled = true;
      };
   }, []);

   return state;
}
