import type { DeepPartial, Snowflake } from "@huginn/shared";
import type { ReactNode } from "react";

import { produce } from "immer";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

import type { AppDirectChannel, MutationKinds } from "@/types";

type DefaultModal = { isOpen: boolean };

const initialStore = () => ({
   settings: { isOpen: false, isClosable: true } as DefaultModal & { isClosable: boolean },
   info: {
      isOpen: false,
      status: "none",
      title: "",
      text: "",
      isClosable: true,
   } as DefaultModal & {
      status: "info" | "success" | "error" | "none";
      text: ReactNode;
      title: string;
      action?: {
         cancel?: {
            text?: string;
            callback: () => void | Promise<void>;
         };
         confirm?: {
            text: string;
            callback: () => void | Promise<void>;
         };
      };
      isClosable: boolean;
   },
   imageCrop: { isOpen: false, originalImageData: "", mimeType: "", callback: undefined } as DefaultModal & {
      originalImageData: string;
      mimeType: string;
      callback?: (data: string) => Promise<void> | void;
   },
   createDM: { isOpen: false } as DefaultModal,
   editGroup: { isOpen: false } as DefaultModal & { channel?: AppDirectChannel },
   addRecipient: { isOpen: false, channelId: "" } as DefaultModal & { channelId: Snowflake },
   magnifiedImage: { isOpen: false, url: "", filename: "", width: 0, height: 0 } as DefaultModal & {
      url: string;
      width: number;
      height: number;
      filename?: string;
   },
   news: { isOpen: false, html: "" } as DefaultModal & { html: string },
   screenShare: { isOpen: false, callback: undefined } as DefaultModal & {
      callback?: (options: {
         type: "display" | "device";
         stream: MediaStream;
         maxAudioBitrate: number;
         maxVideoBitrate: number;
         isAudioEnabled: boolean;
         isSimulcastEnabled: boolean;
         sourceName?: string;
      }) => Promise<void>;
      type: "create" | "change";
   },
   streamAudio: { isOpen: false, callback: undefined } as DefaultModal & {
      callback?: (sourceProcessId: string) => void;
   },
   changeUsername: { isOpen: false } as DefaultModal,
   changeDisplayName: { isOpen: false } as DefaultModal,
   changeEmail: { isOpen: false } as DefaultModal,
   changePassword: { isOpen: false } as DefaultModal,
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
   combine(initialStore(), (set) => ({
      updateModals: (action: DeepPartial<StoreType>) =>
         set(
            produce((draft: StoreType) => {
               for (const [key, value] of Object.entries(action)) {
                  const actualKey = key as keyof typeof draft;
                  Object.assign(draft[actualKey], value);
               }
            }),
         ),
      showError: (text: string) => {
         store.getState().updateModals({ info: { status: "error", title: "Oops!", text, isOpen: true } });
      },
   })),
);

export const modalsStore = store;

export function useModals() {
   return useStore(store);
}
