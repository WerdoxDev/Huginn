import { type GatewayCallState, type GatewayVoiceState, type GatewayVoiceStateFlags, type HMediaKind, log, type Snowflake } from "@huginn/shared";
import type { AudioLevelChecker } from "@lib/voice/audio-level-checker";
import { VoiceClient } from "@lib/voice/voice-client";
import { clientStore } from "@stores/clientStore";
import { produce } from "immer";
import { createStore, useStore } from "zustand";
import { combine, devtools } from "zustand/middleware";
import type { RemoteSource } from "@/types";
import { playAudio } from "@lib/audio-player";

const initialStore = () => ({
   voiceChannel: { guildId: null, channelId: null } as { guildId: Snowflake | null; channelId: Snowflake | null },
   localVoiceState: {} as GatewayVoiceStateFlags,
   voiceStates: [] as Array<GatewayVoiceState>,
   callStates: [] as Array<GatewayCallState>,
   remoteSources: [] as RemoteSource[],
   speakingStates: [] as Array<{ userId: Snowflake; speaking: boolean }>,
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
   devtools(
      combine(initialStore(), (set, get) => ({
         setVoiceChannel: (channelId?: Snowflake, guildId?: Snowflake) => {
            log("app:voice-store", "voice-state", "set voice channel", "cid:", channelId, "gid:", guildId);

            return set({ voiceChannel: { channelId: channelId ?? null, guildId: guildId ?? null } });
         },
         updateLocalVoiceState: (options: GatewayVoiceStateFlags) => {
            log(
               "app:voice-store",
               "voice-state",
               "update self",
               "am:",
               options.isAudioMuted,
               "ad:",
               options.isAudioDeafened,
               "ss:",
               options.isStreaming,
               "co:",
               options.isCameraOn,
            );

            return set({
               localVoiceState: {
                  isAudioMuted: options.isAudioMuted,
                  isAudioDeafened: options.isAudioDeafened,
                  isStreaming: options.isStreaming,
                  isCameraOn: options.isCameraOn,
               },
            });
         },
         updateVoiceState: (options: GatewayVoiceState) => {
            log(
               "app:voice-store",
               "voice-state",
               "update",
               "cid:",
               options.channelId,
               "gid:",
               options.guildId,
               "uid:",
               options.userId,
               "mm:",
               options.isAudioMuted,
               "ad:",
               options.isAudioDeafened,
               "s:",
               options.isStreaming,
               "co:",
               options.isCameraOn,
            );

            return set(
               produce((draft: StoreType) => {
                  const existingIndex = draft.voiceStates.findIndex((x) => x.userId === options.userId);
                  if (existingIndex !== -1) {
                     draft.voiceStates[existingIndex] = { ...options };
                  } else {
                     draft.voiceStates.push({ ...options });
                  }
               }),
            );
         },
         removeVoiceState: (userId: Snowflake) => {
            log("app:voice-store", "voice-state", "remote", "uid:", userId);

            return set((state) => ({ voiceStates: state.voiceStates.filter((x) => x.userId !== userId) }));
         },
         updateCallState: (channelId: Snowflake, messageId: Snowflake, ringing: Snowflake[]) => {
            log("app:voice-store", "call-state", "update", "cid:", channelId, "mid:", messageId, "ring:", ringing.join(","));

            return set(
               produce((draft: StoreType) => {
                  const existingIndex = draft.callStates.findIndex((x) => x.channelId === channelId);
                  if (existingIndex !== -1) {
                     draft.callStates[existingIndex] = { channelId, messageId, ringing };
                  } else {
                     draft.callStates.push({ channelId, messageId, ringing });
                  }
               }),
            );
         },
         removeCallState: (channelId: Snowflake) => {
            log("app:voice-store", "call-state", "remove", "cid:", channelId);

            return set((state) => ({ callStates: state.callStates.filter((x) => x.channelId !== channelId) }));
         },
         addRemoteSource: (
            userId: Snowflake,
            consumerId: string | undefined,
            producerId: string,
            kind: HMediaKind,
            srcObject?: MediaProvider,
            audioLevel?: AudioLevelChecker,
         ) => {
            log("app:voice-store", "remote-sources", "add", "pid:", producerId, "cid:", consumerId, "uid:", userId, "mk:", kind);

            return set((state) => ({ remoteSources: [...state.remoteSources, { consumerId, kind, producerId, userId, srcObject, audioLevel }] }));
         },
         removeRemoteSource: (producerId: string) => {
            log("app:voice-store", "remote-sources", "remove", "pid:", producerId);

            get()
               .remoteSources.find((x) => x.producerId === producerId)
               ?.audioLevel?.offAll("audio-level");
            return set((state) => ({ remoteSources: state.remoteSources.filter((x) => x.producerId !== producerId) }));
         },
         updateRemoteSource: (
            producerId: string,
            options: { consumerId?: string | null; srcObject?: MediaProvider | null; audioLevel?: AudioLevelChecker | null },
         ) => {
            log("app:voice-store", "remote-sources", "update", "pid:", producerId);

            return set(
               produce((draft: StoreType) => {
                  const existingIndex = draft.remoteSources.findIndex((x) => x.producerId === producerId);
                  if (existingIndex !== -1) {
                     const existing = draft.remoteSources[existingIndex];

                     if ("srcObject" in options) existing.srcObject = options.srcObject ?? undefined;
                     if ("audioLevel" in options) existing.audioLevel = options.audioLevel ?? undefined;
                     if ("consumerId" in options) existing.consumerId = options.consumerId ?? undefined;
                  }
               }),
            );
         },
         clearRemoteSources: () => {
            log("app:voice-store", "remote-sources", "clear");

            for (const remote of get().remoteSources) {
               remote.audioLevel?.offAll("audio-level");
            }

            set({ remoteSources: [] });
         },
         updateSpeakingState: (userId: Snowflake, speaking: boolean) => {
            log("app:voice-store", "speaking-state", "update", "uid:", userId, "spk:", speaking);

            return set(
               produce((draft: StoreType) => {
                  const existingIndex = draft.speakingStates.findIndex((x) => x.userId === userId);
                  if (existingIndex !== -1) {
                     draft.speakingStates[existingIndex].speaking = speaking;
                  } else {
                     draft.speakingStates.push({ userId, speaking });
                  }
               }),
            );
         },
         removeSpeakingState: (userId: Snowflake) => {
            log("app:voice-store", "speaking-state", "remove", "uid:", userId);

            return set((state) => ({ speakingStates: state.speakingStates.filter((x) => x.userId !== userId) }));
         },
         clearSpeakingStates: () => {
            log("app:voice-store", "speaking-state", "clear");

            return set({ speakingStates: [] });
         },
      })),
      { name: "Voice" },
   ),
);

export const voiceClient = new VoiceClient();

export function initializeVoice() {
   log("app:voice-store", "default", "initializing");

   const client = clientStore.getState().client;
   const unlisteners: Array<(() => void) | undefined> = [];

   if (!client) {
      return;
   }

   unlisteners.push(
      client.gateway.listen("ready", async (d) => {
         log("app:voice-store", "gateway-recv", "ready");

         store.setState({ voiceStates: d.voiceStates });
         store.setState({ callStates: d.callStates });
      }),
   );

   unlisteners.push(
      client.gateway.listen("call_create", (d) => {
         log("app:voice-store", "gateway-recv", "call create", "cid:", d.channelId, "mid:", d.messageId, "ring:", d.ringing.join(","));

         store.getState().updateCallState(d.channelId, d.messageId, d.ringing);
      }),
   );

   unlisteners.push(
      client.gateway.listen("call_update", (d) => {
         log("app:voice-store", "gateway-recv", "call update", "cid:", d.channelId, "mid:", d.messageId, "ring:", d.ringing.join(","));

         store.getState().updateCallState(d.channelId, d.messageId, d.ringing);
      }),
   );

   unlisteners.push(
      client.gateway.listen("call_delete", (d) => {
         log("app:voice-store", "gateway-recv", "call delete", "cid:", d.channelId);

         store.getState().removeCallState(d.channelId);
      }),
   );

   unlisteners.push(
      client.gateway.listen("voice_state_update", (d) => {
         log(
            "app:voice-store",
            "gateway-recv",
            "voice state update",
            "cid:",
            d.channelId,
            "gid:",
            d.guildId,
            "uid:",
            d.userId,
            "mm:",
            d.isAudioMuted,
            "ad:",
            d.isAudioDeafened,
            "s:",
            d.isStreaming,
            "co:",
            d.isCameraOn,
         );

         const thisStore = store.getState();

         //TODO: A BETTER WAY IS TO NOT SET USER VC STATUS TI DISCONNECT DIRECTLY AFTER GATEWAY DISCONNECT
         if (d.userId === client.user?.id && client.gateway.status !== "authenticated" && d.sessionId === client.gateway.sessionId) {
            return;
         }

         // our user's voice state update
         if (d.userId === client?.user?.id && d.sessionId === client.gateway.sessionId) {
            thisStore.setVoiceChannel(d.channelId ?? undefined, d.guildId ?? undefined);
         }

         if (d.channelId) {
            thisStore.updateVoiceState(d);
         } else {
            thisStore.removeVoiceState(d.userId);
         }

         const lastState = thisStore.voiceStates.find((x) => x.userId === d.userId);
         const currentStore = voiceStore.getState();
         const currentState = currentStore.voiceStates.find((x) => x.userId === d.userId);
         const currentChannel = currentStore.voiceChannel;

         // User was not here and just joined the call
         if ((!lastState || lastState.channelId !== currentState?.channelId) && currentState?.channelId === currentChannel.channelId) {
            playAudio("voice-enter");
         }

         // User is no longer here but was here before
         else if (
            (!currentState || currentState.channelId !== lastState?.channelId) &&
            (lastState?.channelId === currentChannel.channelId || (d.userId === client?.user?.id && d.sessionId === client.gateway.sessionId))
         ) {
            playAudio("voice-leave");
         }
      }),
   );

   unlisteners.push(voiceClient.listenToVoiceEvents());

   unlisteners.push(
      client.voice.listen("local_voice_state_changed", (d) => {
         log("app:voice-store", "voice-recv", "update", "am:", d.isAudioMuted, "ap:", d.isAudioPaused, "cm:", d.isAudioDeafened, "s:", d.isStreaming);

         if (!client?.user) {
            return;
         }

         const thisStore = store.getState();

         // If we have a mic producer, manage it's state
         const producer = client.voice.producers.get("microphone");
         if (producer) {
            if (d.isAudioMuted || d.isAudioPaused) {
               thisStore.updateSpeakingState(client.user.id, false);
            } else if (!d.isAudioMuted && !d.isAudioPaused) {
               thisStore.updateSpeakingState(client.user.id, true);
            }
         }

         thisStore.updateLocalVoiceState({
            isAudioDeafened: d.isAudioDeafened,
            isCameraOn: d.isCameraOn,
            isAudioMuted: d.isAudioMuted,
            isStreaming: d.isStreaming,
         });
      }),
   );

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
