import { type GatewayCallState, type GatewayVoiceState, type HMediaKind, log, type Snowflake } from "@huginn/shared";
import type { AudioLevelChecker } from "@lib/voice/audio-level-checker";
import { VoiceClient } from "@lib/voice/voice-client";
import { client } from "@stores/clientStore";
import { produce } from "immer";
import { createStore, useStore } from "zustand";
import { combine, devtools } from "zustand/middleware";
import type { RemoteSource, VoicePreference } from "@/types";

const initialStore = () => ({
   localVoiceState: {} as GatewayVoiceState,
   voiceStates: [] as Array<GatewayVoiceState>,
   callStates: [] as Array<GatewayCallState>,
   remoteSources: [] as RemoteSource[],
   speakingStates: [] as Array<{ userId: Snowflake; speaking: boolean }>,
   voicePreferences: [] as VoicePreference[],
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
   devtools(
      combine(initialStore(), (set, get) => ({
         setVoiceChannel: (channelId?: Snowflake, guildId?: Snowflake) => {
            log("app:voice-store", "voice-state", "set channel", "cid:", channelId, "gid:", guildId)

            return set((state) => ({ localVoiceState: { ...state.localVoiceState, channelId: channelId ?? null, guildId: guildId ?? null } }))
         },
         updateLocalVoiceState: (selfMute: boolean, selfDeaf: boolean, selfStream: boolean, selfVideo: boolean) => {
            log("app:voice-store", "voice-state", "update self", "sm:", selfMute, "sd:", selfDeaf, "ss:", selfStream, "sv:", selfVideo)

            return set((state) => ({ localVoiceState: { ...state.localVoiceState, selfMute, selfDeaf, selfStream, selfVideo } }))
         },
         updateVoiceState: (
            channelId: Snowflake,
            guildId: Snowflake | null,
            userId: Snowflake,
            selfMute: boolean,
            selfDeaf: boolean,
            selfStream: boolean,
            selfVideo: boolean,
         ) => {
            log("app:voice-store", "voice-state", "update", "cid:", channelId, "gid:", guildId, "uid:", userId, "sm:", selfMute, "sd:", selfDeaf, "ss:", selfStream, "sv:", selfVideo)

            return set(
               produce((draft: StoreType) => {
                  const existingIndex = draft.voiceStates.findIndex((x) => x.userId === userId);
                  if (existingIndex !== -1) {
                     draft.voiceStates[existingIndex] = { guildId, channelId, userId, selfDeaf, selfMute, selfStream, selfVideo };
                  } else {
                     draft.voiceStates.push({ guildId, channelId, selfDeaf, selfMute, userId, selfStream, selfVideo });
                  }
               }),
            )
         },
         removeVoiceState: (userId: Snowflake) => {
            log("app:voice-store", "voice-state", "remote", "uid:", userId)

            return set((state) => ({ voiceStates: state.voiceStates.filter((x) => x.userId !== userId) }))
         },
         updateCallState: (channelId: Snowflake, messageId: Snowflake, ringing: Snowflake[]) => {
            log("app:voice-store", "call-state", "update", "cid:", channelId, "mid:", messageId, "ring:", ringing.join(","))

            return set(
               produce((draft: StoreType) => {
                  const existingIndex = draft.callStates.findIndex((x) => x.channelId === channelId);
                  if (existingIndex !== -1) {
                     draft.callStates[existingIndex] = { channelId, messageId, ringing };
                  } else {
                     draft.callStates.push({ channelId, messageId, ringing });
                  }
               }),
            )
         },
         removeCallState: (channelId: Snowflake) => {
            log("app:voice-store", "call-state", "remove", "cid:", channelId)

            return set((state) => ({ callStates: state.callStates.filter((x) => x.channelId !== channelId) }))
         },
         addRemoteSource: (
            userId: Snowflake,
            consumerId: string | undefined,
            producerId: string,
            kind: HMediaKind,
            srcObject: MediaProvider,
            audioLevel?: AudioLevelChecker,
         ) => set((state) => {
            log("app:voice-store", "remote-sources", "add", "pid:", producerId, "cid:", consumerId, "uid:", userId, "mk:", kind)

            return ({ remoteSources: [...state.remoteSources, { consumerId, kind, producerId, userId, srcObject, audioLevel }] })
         }),
         removeRemoteSource: (producerId: string) => {
            log("app:voice-store", "remote-sources", "remove", "pid:", producerId)

            get()
               .remoteSources.find((x) => x.producerId === producerId)
               ?.audioLevel?.offAll("audio-level");
            return set((state) => ({ remoteSources: state.remoteSources.filter((x) => x.producerId !== producerId) }));
         },
         updateRemoteSource: (producerId: string, srcObject: MediaProvider) => {
            log("app:voice-store", "remote-sources", "update", "pid:", producerId)

            return set(
               produce((draft: StoreType) => {
                  const existingIndex = draft.remoteSources.findIndex((x) => x.producerId === producerId);
                  if (existingIndex !== -1) {
                     draft.remoteSources[existingIndex].srcObject = srcObject;
                  }
               }),
            )
         },
         clearRemoteSources: () => {
            log("app:voice-store", "remote-sources", "clear")

            for (const remote of get().remoteSources) {
               remote.audioLevel?.offAll("audio-level");
            }

            set({ remoteSources: [] });
         },
         updateSpeakingState: (userId: Snowflake, speaking: boolean) => {
            log("app:voice-store", "speaking-state", "update", "uid:", userId, "spk:", speaking)

            return set(
               produce((draft: StoreType) => {
                  const existingIndex = draft.speakingStates.findIndex((x) => x.userId === userId);
                  if (existingIndex !== -1) {
                     draft.speakingStates[existingIndex].speaking = speaking;
                  } else {
                     draft.speakingStates.push({ userId, speaking });
                  }
               }),
            )
         },
         removeSpeakingState: (userId: Snowflake) => {
            log("app:voice-store", "speaking-state", "remove", "uid:", userId);

            return set((state) => ({ speakingStates: state.speakingStates.filter((x) => x.userId !== userId) }))
         },
         clearSpeakingStates: () => {
            log("app:voice-store", "speaking-state", "clear")

            return set({ speakingStates: [] });
         },
         updateVoicePreferences: (userId: Snowflake, update: { microphoneVolume?: number; screenshareVolume?: number }) => {
            log("app:voice-store", "voice-preferences", "update", "uid:", userId, "mvol:", update.microphoneVolume, "svol:", update.screenshareVolume)

            return set(
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
            )
         }
      })),
      { name: "Voice" },
   ),
);

export const voiceClient = new VoiceClient();

export function initializeVoice() {
   log("app:voice-store", "default", "initializing");

   const unlisteners: Array<(() => void) | undefined> = [];

   if (!client) {
      return;
   }

   unlisteners.push(client.gateway.listen("ready", (d) => {
      log("app:voice-store", "gateway-recv", "ready");

      store.setState({ voiceStates: d.voiceStates });
      store.setState({ callStates: d.callStates });

      // TODO: Read each user's voice preference from local storage
      store.setState({ voicePreferences: d.voiceStates.map((x) => ({ userId: x.userId, microphoneVolume: 100, screenshareVolume: 100 })) });
   }));

   unlisteners.push(client.gateway.listen("call_create", (d) => {
      log("app:voice-store", "gateway-recv", "call create", "cid:", d.channelId, "mid:", d.messageId, "ring:", d.ringing.join(","));

      store.getState().updateCallState(d.channelId, d.messageId, d.ringing);
   }));

   unlisteners.push(client.gateway.listen("call_update", (d) => {
      log("app:voice-store", "gateway-recv", "call update", "cid:", d.channelId, "mid:", d.messageId, "ring:", d.ringing.join(","));

      store.getState().updateCallState(d.channelId, d.messageId, d.ringing);
   }));

   unlisteners.push(client.gateway.listen("call_delete", (d) => {
      log("app:voice-store", "gateway-recv", "call delete", "cid:", d.channelId);

      store.getState().removeCallState(d.channelId);
   }));

   unlisteners.push(client.gateway.listen("voice_state_update", (d) => {
      log("app:voice-store", "gateway-recv", "voice state update", "cid:", d.channelId, "gid:", d.guildId, "uid:", d.userId, "sm:", d.selfMute, "sd:", d.selfDeaf, "ss:", d.selfStream, "sv:", d.selfVideo)

      const thisStore = store.getState();

      // our user's voice state update
      if (d.userId === client?.user?.id) {
         thisStore.setVoiceChannel(d.channelId ?? undefined, d.guildId ?? undefined);
         // client.voice.updateLocalVoiceState({ audioMuted: d.selfMute, consumersMuted: d.selfDeaf, streaming: d.selfStream, camera: d.selfVideo });
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
      log("app:voice-store", "voice-recv", "update", "am:", d.audioMuted, "ap:", d.audioPaused, "cm:", d.consumersMuted, "s:", d.streaming)

      if (!client?.user) {
         return;
      }

      const thisStore = store.getState();

      // If we have a mic producer, manage it's state
      const producer = client.voice.producers.get("microphone");
      if (producer) {
         if (d.audioMuted || d.audioPaused) {
            thisStore.updateSpeakingState(client.user.id, false);
         } else if (!d.audioMuted && !d.audioPaused) {
            thisStore.updateSpeakingState(client.user.id, true);
         }
      }

      thisStore.updateLocalVoiceState(d.audioMuted, d.consumersMuted, d.streaming, d.camera);
   }));

   return () => {
      log("app:voice-store", "default", "uninitialize");

      for (const unlisten of unlisteners) {
         unlisten?.();
      }
   };
}

export function useVoiceStore() {
   return useStore(store);
}

export const voiceStore = store;
