import { type GatewayCallState, type GatewayVoiceState, type Snowflake } from "@huginnjs/shared";
import { playAudio } from "@lib/audio-player";
import { syncZustandStore } from "@lib/sync-zustand";
import { clientStore } from "@stores/clientStoreState";
import { produce } from "immer";
import { createStore, useStore } from "zustand";
import { combine, devtools } from "zustand/middleware";

import { storageStore } from "./storageStore";

const initialStore = () => ({
   voiceState: {} as GatewayVoiceState,
   voiceStates: [] as Array<GatewayVoiceState>,
   callStates: [] as Array<GatewayCallState>,
   speakingStates: [] as Array<{ userId: Snowflake; speaking: boolean }>,
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
   devtools(
      combine(initialStore(), (set) => ({
         updateVoiceState: (options: GatewayVoiceState) =>
            set(
               produce((draft: StoreType) => {
                  const existingIndex = draft.voiceStates.findIndex((x) => x.userId === options.userId);
                  if (existingIndex !== -1) {
                     draft.voiceStates[existingIndex] = { ...options };
                  } else {
                     draft.voiceStates.push({ ...options });
                  }
               }),
            ),
         removeVoiceState: (userId: Snowflake) =>
            set((state) => ({
               voiceStates: state.voiceStates.filter((x) => x.userId !== userId),
            })),
         updateCallState: (channelId: Snowflake, messageId: Snowflake, ringing: Snowflake[]) =>
            set(
               produce((draft: StoreType) => {
                  const existingIndex = draft.callStates.findIndex((x) => x.channelId === channelId);
                  if (existingIndex !== -1) {
                     draft.callStates[existingIndex] = {
                        channelId,
                        messageId,
                        ringing,
                     };
                  } else {
                     draft.callStates.push({ channelId, messageId, ringing });
                  }
               }),
            ),
         removeCallState: (channelId: Snowflake) =>
            set((state) => ({
               callStates: state.callStates.filter((x) => x.channelId !== channelId),
            })),
         updateSpeakingState: (userId: Snowflake, speaking: boolean) =>
            set(
               produce((draft: StoreType) => {
                  const existingIndex = draft.speakingStates.findIndex((x) => x.userId === userId);
                  if (existingIndex !== -1) {
                     draft.speakingStates[existingIndex].speaking = speaking;
                  } else {
                     draft.speakingStates.push({ userId, speaking });
                  }
               }),
            ),
         removeSpeakingState: (userId: Snowflake) =>
            set((state) => ({
               speakingStates: state.speakingStates.filter((x) => x.userId !== userId),
            })),
         clearSpeakingStates: () => set({ speakingStates: [] }),
      })),
      { name: "Voice" },
   ),
);

export async function initVoiceStore() {
   const client = clientStore.getState().client;
   const unlisteners: Array<(() => void) | undefined> = [];

   if (!client) return;

   const settings = storageStore.getState().getCachedValue("settings");
   const isDeafened = settings?.isVoiceDeafened ?? false;
   const isMuted = settings?.isVoiceMuted ?? false;
   store.setState({
      voiceState: client.voiceManager.voiceState.gatewayVoiceState,
   });
   store.setState((state) => ({
      voiceState: {
         ...state.voiceState,
         isAudioMuted: isDeafened ? true : isMuted,
         isAudioDeafened: isDeafened,
      },
   }));
   await client.voiceManager.voiceState.updateGatewayVoiceState({
      isAudioMuted: isDeafened ? true : isMuted,
      isAudioDeafened: isDeafened,
   });
   store.setState({
      voiceState: client.voiceManager.voiceState.gatewayVoiceState,
   });

   unlisteners.push(
      client.gateway.listen("ready", async (d) => {
         store.setState({ voiceStates: d.voiceStates });
         store.setState({ callStates: d.callStates });
      }),
   );

   unlisteners.push(
      client.gateway.listen("call_create", (d) => {
         store.getState().updateCallState(d.channelId, d.messageId, d.ringing);
      }),
   );

   unlisteners.push(
      client.gateway.listen("call_update", (d) => {
         store.getState().updateCallState(d.channelId, d.messageId, d.ringing);
      }),
   );

   unlisteners.push(
      client.gateway.listen("call_delete", (d) => {
         store.getState().removeCallState(d.channelId);
      }),
   );

   unlisteners.push(
      client.gateway.listen("voice_state_update", (d) => {
         const thisStore = store.getState();
         const lastState = thisStore.voiceStates.find((x) => x.userId === d.userId);
         const currentUserId = client.currentUser?.id;
         const isCurrentUser = d.userId === currentUserId;
         const previousOurChannelId = thisStore.voiceStates.find((x) => x.userId === currentUserId)?.channelId;

         if (d.channelId) {
            thisStore.updateVoiceState(d);
         } else {
            thisStore.removeVoiceState(d.userId);
         }

         const currentStore = voiceStore.getState();
         const currentState = currentStore.voiceStates.find((x) => x.userId === d.userId);
         const currentOurChannelId = currentStore.voiceStates.find((x) => x.userId === currentUserId)?.channelId;
         const joinedChannel = !lastState?.channelId && !!currentState?.channelId;
         const leftChannel = !!lastState?.channelId && !currentState?.channelId;
         const changedChannel = lastState?.channelId !== currentState?.channelId;

         const joinedOurChannel = !isCurrentUser && changedChannel && !!currentOurChannelId && currentState?.channelId === currentOurChannelId;
         const leftOurChannel = !isCurrentUser && changedChannel && !!previousOurChannelId && lastState?.channelId === previousOurChannelId;

         if ((isCurrentUser && joinedChannel) || joinedOurChannel) {
            playAudio("voice-enter");
         } else if ((isCurrentUser && leftChannel) || leftOurChannel) {
            playAudio("voice-leave");
         }
      }),
   );

   unlisteners.push(
      client.voiceManager.voiceState.listen("gateway_voice_state_updated", (d) => {
         store.setState({ voiceState: d });
      }),
   );

   return () => {
      for (const unlisten of unlisteners) {
         unlisten?.();
      }
   };
}

export function useVoiceStore() {
   return useStore(store);
}

export const voiceStore = store;

syncZustandStore(store, {
   name: "voiceStore",
   partialize: (state) => ({
      voiceState: state.voiceState,
      voiceStates: state.voiceStates,
      callStates: state.callStates,
      speakingStates: state.speakingStates,
   }),
});
