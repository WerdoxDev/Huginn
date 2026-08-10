import type { DeepPartial, Snowflake } from "@huginnjs/shared";
import type { ReactNode } from "react";

import { produce } from "immer";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

import type { AppDirectChannel } from "@/types";

type DefaultModal = { isOpen: boolean };

const initialStore = () => ({
   settings: { isOpen: false, isClosable: true } as DefaultModal & { isClosable: boolean },
   info: {
      isOpen: false,
      status: "none",
      title: "",
      text: "",
      errorCode: "",
      isClosable: true,
   } as DefaultModal & {
      status: "info" | "success" | "error" | "none";
      text: ReactNode;
      title: string;
      errorCode?: string;
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
   imageCrop: { isOpen: false, originalImageData: "", mimeType: "", cropType: "avatar", callback: undefined } as DefaultModal & {
      originalImageData: string;
      mimeType: string;
      cropType?: "avatar" | "banner" | "chat-background";
      callback?: (data: string) => Promise<void> | void;
      profilePreview?: {
         userId: Snowflake;
         avatarImageSrc?: string | null;
         bannerImageSrc?: string | null;
      };
   },
   createDM: { isOpen: false } as DefaultModal,
   editGroup: { isOpen: false } as DefaultModal & { channel?: AppDirectChannel },
   addRecipient: { isOpen: false, channelId: "" } as DefaultModal & { channelId: Snowflake },
   magnifiedMedia: { isOpen: false, url: "", filename: "", width: 0, height: 0, type: "image" } as DefaultModal & {
      url: string;
      width: number;
      height: number;
      filename?: string;
      type: "image" | "video";
   },
   news: { isOpen: false, lastVersion: undefined } as DefaultModal & { lastVersion?: string },
   screenShare: { isOpen: false, callback: undefined } as DefaultModal & {
      callback?: (options: {
         type: "screen" | "application" | "device";
         stream: MediaStream;
         maxAudioBitrate: number;
         maxVideoBitrate: number;
         isAudioEnabled: boolean;
         isSimulcastEnabled: boolean;
         processId?: number;
      }) => Promise<void>;
      errback?: (options: { error: unknown }) => void;
      type: "create" | "change";
   },
   audioStream: { isOpen: false, callback: undefined } as DefaultModal & {
      callback?: (options: { processId: number; maxAudioBitrate: number }) => Promise<void>;
      errback?: (options: { error: unknown }) => void;
   },
   changeUsername: { isOpen: false } as DefaultModal,
   changeDisplayName: { isOpen: false } as DefaultModal,
   changeEmail: { isOpen: false } as DefaultModal,
   verifyEmail: { isOpen: false, pendingEmail: null, onSuccess: undefined } as DefaultModal & {
      pendingEmail: string | null;
      onSuccess?: () => Promise<void> | void;
   },
   changePassword: { isOpen: false } as DefaultModal,
   userProfile: { isOpen: false, userId: "" } as DefaultModal & { userId: Snowflake },
   changeBackground: { isOpen: false, channelId: null } as DefaultModal & { channelId: Snowflake | null },
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
   combine(initialStore(), (set) => ({
      updateModals: (action: DeepPartial<StoreType>) =>
         set(
            produce((draft: StoreType) => {
               for (const [key, value] of Object.entries(action)) {
                  const actualKey = key as keyof typeof draft;
                  if (value.isOpen) (draft[actualKey] as StoreType[keyof typeof draft]) = value as StoreType[keyof typeof draft];
                  else draft[actualKey].isOpen = false;
                  // if (draft[actualKey].isOpen) draft[actualKey] = value ;
                  // Object.assign(draft[actualKey], value);
               }
               // draft[action.]
            }),
         ),
      showError: (text: string, errorCode?: string) => {
         store.getState().updateModals({ info: { status: "error", title: "Oops!", text, errorCode, isOpen: true } });
      },
   })),
);

export const modalsStore = store;

export function useModals() {
   return useStore(store);
}
