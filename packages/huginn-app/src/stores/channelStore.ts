import type { Snowflake } from "@huginn/shared";

import { produce } from "immer";
import { create } from "zustand";
import { combine } from "zustand/middleware";

import type { UploadProgress } from "@/types";

export type SavedScrollState = { type: "bottom" } | { type: "position"; scrollTop: number; messageBoxHeight: number };

const initialStore = () => ({
   savedScrolls: new Map<Snowflake, SavedScrollState>(),
   currentVisibleMessages: [] as Array<{
      messageId: Snowflake;
      messageTimestamp: number;
      channelId: Snowflake;
   }>,
   messageUploadProgresses: [] as UploadProgress[],
   currentEditingMessageId: undefined as Snowflake | undefined,
   currentReplyingMessageId: undefined as Snowflake | undefined,
   messageBoxHeight: 0,
});

type StoreType = ReturnType<typeof initialStore>;

export const useChannelStore = create(
   combine(initialStore(), (set) => ({
      saveScroll: (channelId: Snowflake, scroll: SavedScrollState) =>
         set((state) => ({ savedScrolls: new Map(state.savedScrolls).set(channelId, scroll) })),
      resetScrolls: () => set({ savedScrolls: new Map() }),
      addVisibleMessage: (id: Snowflake, timestamp: number, channelId: Snowflake) =>
         set((state) => ({
            currentVisibleMessages: [
               ...state.currentVisibleMessages.filter((x) => x.messageId !== id),
               { messageId: id, messageTimestamp: timestamp, channelId: channelId },
            ],
         })),
      removeVisibleMessage: (id: Snowflake) =>
         set((state) => ({
            currentVisibleMessages: state.currentVisibleMessages.filter((x) => x.messageId !== id),
         })),
      clearVisibleMessages: () => set({ currentVisibleMessages: [] }),
      updateMessageUploadProgress: (progress: UploadProgress) =>
         set(
            produce((draft: StoreType) => {
               const existingIndex = draft.messageUploadProgresses.findIndex((x) => x.messageId === progress.messageId);
               if (existingIndex !== -1) {
                  const existing = draft.messageUploadProgresses[existingIndex];
                  draft.messageUploadProgresses[existingIndex] = { ...existing, ...progress };
               } else {
                  draft.messageUploadProgresses.push(progress);
               }
            }),
         ),
      removeMessageUploadProgress: (messageId: Snowflake) =>
         set((state) => ({
            messageUploadProgresses: state.messageUploadProgresses.filter((x) => x.messageId !== messageId),
         })),
      setEditingMessageId: (messageId: Snowflake | undefined) => set({ currentEditingMessageId: messageId }),
      setReplyingMessageId: (messageId: Snowflake | undefined) => set({ currentReplyingMessageId: messageId }),
      setMessageBoxHeight: (height: number) => set({ messageBoxHeight: height }),
   })),
);
