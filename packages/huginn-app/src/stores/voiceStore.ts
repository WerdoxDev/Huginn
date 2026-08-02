import { type GatewayCallState, type GatewayVoiceState, type GatewayVoiceStateFlags, type Snowflake } from "@huginnjs/shared";
import { playAudio } from "@lib/audio-player";
import { syncZustandStore } from "@lib/sync-zustand";
import { clientStore } from "@stores/clientStore";
import { produce } from "immer";
import { createStore, useStore } from "zustand";
import { combine, devtools } from "zustand/middleware";

import { storageStore } from "./storageStore";

const initialStore = () => ({
   voiceConnection: {} as {
      userId: Snowflake;
      guildId: Snowflake | null;
      channelId: Snowflake | null;
      sessionId: Snowflake;
   },
   voiceState: {} as GatewayVoiceStateFlags,
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
                     draft.callStates[existingIndex] = { channelId, messageId, ringing };
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

         //TODO: A BETTER WAY IS TO NOT SET USER VC STATUS TI DISCONNECT DIRECTLY AFTER GATEWAY DISCONNECT
         // if (d.userId === client.currentUser?.id && client.gateway.status !== "authenticated" && d.sessionId === client.gateway.sessionId) {
         //    return;
         // }

         // our user's voice state update
         if (d.userId === client?.currentUser?.id && d.sessionId === client.gateway.sessionId) {
            store.setState({
               voiceConnection: {
                  channelId: d.channelId,
                  guildId: d.guildId,
                  sessionId: d.sessionId,
                  userId: d.userId,
               },
            });
         }

         // CAPTURE THE OLD STATE BEFORE UPDATING
         const lastState = thisStore.voiceStates.find((x) => x.userId === d.userId);

         // NOW UPDATE THE STORE
         if (d.channelId) {
            thisStore.updateVoiceState(d);
         } else {
            thisStore.removeVoiceState(d.userId);
         }

         // GET THE NEW STATE AFTER UPDATING
         const currentStore = voiceStore.getState();
         const ourChannelId = currentStore.voiceStates.find((x) => x.userId === client.currentUser?.id)?.channelId;
         const currentState = currentStore.voiceStates.find((x) => x.userId === d.userId);

         // User just joined our voice channel
         if (currentState?.channelId && lastState?.channelId !== currentState.channelId && currentState.channelId === ourChannelId) {
            playAudio("voice-enter");
         }
         // User left our voice channel
         else if (lastState?.channelId && lastState.channelId !== currentState?.channelId) {
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
      voiceConnection: state.voiceConnection,
      voiceState: state.voiceState,
      voiceStates: state.voiceStates,
      callStates: state.callStates,
      speakingStates: state.speakingStates,
   }),
});
