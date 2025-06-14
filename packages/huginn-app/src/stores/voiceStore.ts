import type { RemoteSource, VoicePrereference } from "@/types";
import type { GatewayCallState, GatewayVoiceState, HMediaKind, Snowflake } from "@huginn/shared";
import type { AudioLevelChecker } from "@lib/voice/audio-level-checker";
import { VoiceClient } from "@lib/voice/voice-client";
import { client } from "@stores/apiStore";
import { userStore } from "@stores/userStore";
import type { QueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { createStore, useStore } from "zustand";
import { combine, devtools } from "zustand/middleware";
import { settingsStore } from "./settingsStore";

const initialStore = () => ({
   voiceState: {} as GatewayVoiceState,
   voiceStates: [] as Array<GatewayVoiceState>,
   callStates: [] as Array<GatewayCallState>,
   remoteSources: [] as RemoteSource[],
   speakingStates: [] as Array<{ userId: Snowflake; speaking: boolean }>,
   voicePreferences: [] as VoicePrereference[],
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
   devtools(
      combine(initialStore(), (set, get) => ({
         setVoiceChannel: (channelId?: Snowflake, guildId?: Snowflake) =>
            set((state) => ({ voiceState: { ...state.voiceState, channelId: channelId ?? null, guildId: guildId ?? null } })),
         updateSelfVoiceState: (selfMute: boolean, selfDeaf: boolean, selfStream: boolean, selfVideo: boolean) =>
            set((state) => ({ voiceState: { ...state.voiceState, selfMute, selfDeaf, selfStream, selfVideo } })),
         updateVoiceState: (
            channelId: Snowflake,
            guildId: Snowflake | null,
            userId: Snowflake,
            selfMute: boolean,
            selfDeaf: boolean,
            selfStream: boolean,
            selfVideo: boolean,
         ) =>
            set(
               produce((draft: StoreType) => {
                  const existingIndex = draft.voiceStates.findIndex((x) => x.userId === userId);
                  if (existingIndex !== -1) {
                     draft.voiceStates[existingIndex] = { guildId, channelId, userId, selfDeaf, selfMute, selfStream, selfVideo };
                  } else {
                     draft.voiceStates.push({ guildId, channelId, selfDeaf, selfMute, userId, selfStream, selfVideo });
                  }
               }),
            ),
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
         removeVoiceState: (userId: Snowflake) => set((state) => ({ voiceStates: state.voiceStates.filter((x) => x.userId !== userId) })),
         removeCallState: (channelId: Snowflake) => set((state) => ({ callStates: state.callStates.filter((x) => x.channelId !== channelId) })),
         addRemoteSource: (
            userId: Snowflake,
            consumerId: string | undefined,
            producerId: string,
            kind: HMediaKind,
            srcObject: MediaProvider,
            audioLevel?: AudioLevelChecker,
         ) => set((state) => ({ remoteSources: [...state.remoteSources, { consumerId, kind, producerId, userId, srcObject, audioLevel }] })),
         removeRemoteSource: (producerId: string) => {
            get()
               .remoteSources.find((x) => x.producerId === producerId)
               ?.audioLevel?.offAll("audio-level");
            return set((state) => ({ remoteSources: state.remoteSources.filter((x) => x.producerId !== producerId) }));
         },
         updateRemoteSource: (producerId: string, srcObject: MediaProvider) =>
            set(
               produce((draft: StoreType) => {
                  const existingIndex = draft.remoteSources.findIndex((x) => x.producerId === producerId);
                  if (existingIndex !== -1) {
                     draft.remoteSources[existingIndex].srcObject = srcObject;
                  }
               }),
            ),
         clearRemoteSources: () => {
            for (const remote of get().remoteSources) {
               remote.audioLevel?.offAll("audio-level");
            }
            set({ remoteSources: [] });
         },
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
         removeSpeakingState: (userId: Snowflake) => set((state) => ({ speakingStates: state.speakingStates.filter((x) => x.userId !== userId) })),
         clearSpeakingStates: () => set({ speakingStates: [] }),
         updateVoicePreferences: (userId: Snowflake, update: { microphoneVolume?: number; screenshareVolume?: number }) =>
            set(
               produce((draft: StoreType) => {
                  const existingIndex = draft.voicePreferences.findIndex((x) => x.userId === userId);
                  if (existingIndex !== -1) {
                     draft.voicePreferences[existingIndex] = { ...draft.voicePreferences[existingIndex], ...update };
                  } else {
                     if (!update.microphoneVolume || !update.screenshareVolume) {
                        throw new Error("Creating new voice preference requires both microphone and screenshare volumes");
                     }

                     draft.voicePreferences.push({
                        userId,
                        microphoneVolume: update.microphoneVolume,
                        screenshareVolume: update.screenshareVolume,
                     });
                  }
               }),
            ),
      })),
      { name: "Voice" },
   ),
);

export const voiceClient = new VoiceClient();

export function initializeVoice(queryClient: QueryClient) {
   const unlisteners: Array<() => void> = [];

   unlisteners.push(client.gateway.listen("ready", (d) => {
      store.setState({ voiceStates: d.voiceStates });
      store.setState({ callStates: d.callStates });

      // TODO: Read each user's voice prefernece from local storage
      store.setState({ voicePreferences: d.voiceStates.map((x) => ({ userId: x.userId, microphoneVolume: 100, screenshareVolume: 100 })) });
   }));

   unlisteners.push(client.gateway.listen("call_create", (d) => {
      store.getState().updateCallState(d.channelId, d.messageId, d.ringing);
   }));

   unlisteners.push(client.gateway.listen("call_update", (d) => {
      store.getState().updateCallState(d.channelId, d.messageId, d.ringing);
   }));

   unlisteners.push(client.gateway.listen("call_delete", (d) => {
      store.getState().removeCallState(d.channelId);
   }));

   unlisteners.push(client.gateway.listen("voice_state_update", (d) => {
      const thisStore = store.getState();

      // our user's voice state update
      if (d.userId === userStore.getState().user?.id) {
         thisStore.setVoiceChannel(d.channelId ?? undefined, d.guildId ?? undefined);

         // set speaking to false when we mute in the middle of speaking
         if (d.selfMute) {
            thisStore.updateSpeakingState(d.userId, false);
            // set speaking to true when we unmute in the middle of speaking
         } else if (!client.voice.localVoiceState.audioPaused) {
            thisStore.updateSpeakingState(d.userId, true);
         }
      } else {
         // create voice preference for new users
         if (!thisStore.voicePreferences.some((x) => x.userId === d.userId)) {
            thisStore.updateVoicePreferences(d.userId, { microphoneVolume: 100, screenshareVolume: 100 });
         }
      }

      if (d.channelId) {
         thisStore.updateVoiceState(d.channelId, d.guildId, d.userId, d.selfMute, d.selfDeaf, d.selfStream, d.selfVideo);
      } else {
         thisStore.removeVoiceState(d.userId);
      }
   }));

   unlisteners.push(voiceClient.listenToVoiceEvents());

   unlisteners.push(client.voice.listen("local_voice_state_changed", (d) => {
      if (!client.user) {
         return;
      }

      voiceStore.getState().updateSelfVoiceState(d.audioMuted, d.consumersMuted, d.streaming, false);
   }));

   return () => {
      for (const unlisten of unlisteners) {
         unlisten();
      }
   };
}

export function useVoiceStore() {
   return useStore(store);
}

export const voiceStore = store;
