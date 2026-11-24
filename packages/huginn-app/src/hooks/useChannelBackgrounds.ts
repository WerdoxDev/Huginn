import type { BackgroundStyle, Snowflake } from "@huginnjs/shared";

import { clientStore, useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useStore } from "zustand";

import { useEditSettings } from "./mutations/useEditSettings";

export type BackgroundScope = Snowflake | "global";

export function useBackgroundImageUrl(image: string | undefined, scope: BackgroundScope) {
   const client = useClient();
   const { user } = useThisUser();

   if (!image) return undefined;
   if (image.startsWith("data:") || image.startsWith("blob:")) return image;
   if (!user?.id) return undefined;

   return client?.cdn.channelBackground(scope, user.id, image);
}

export function useGlobalChannelBackground() {
   const background = useStore(clientStore, (state) => state.userSettings?.globalChannelBackground);
   const mutation = useEditSettings();

   function saveGlobalChannelBackground(style: BackgroundStyle, onSuccess?: () => void) {
      mutation.mutate({ globalChannelBackground: style }, { onSuccess });
   }

   function resetGlobalChannelBackground(onSuccess?: () => void) {
      mutation.mutate({ globalChannelBackground: null }, { onSuccess });
   }

   return {
      background,
      saveGlobalChannelBackground,
      resetGlobalChannelBackground,
      isLoading: mutation.isPending,
   };
}

export function useChannelBackgrounds(channelId: Snowflake) {
   const channelBackgrounds = useStore(clientStore, (state) => state.userSettings?.channelBackgrounds);
   const globalChannelBackground = useStore(clientStore, (state) => state.userSettings?.globalChannelBackground);
   const mutation = useEditSettings();

   const channelBackground = channelBackgrounds?.find((background) => background.channelId === channelId);
   const background = channelBackground ?? globalChannelBackground;
   const backgroundScope: BackgroundScope = channelBackground ? channelId : "global";

   function saveChannelBackground(style: BackgroundStyle, onSuccess?: () => void) {
      mutation.mutate(
         {
            channelBackgrounds: [...(channelBackgrounds ?? []).filter((background) => background.channelId !== channelId), { ...style, channelId }],
         },
         { onSuccess },
      );
   }

   function resetChannelBackground(onSuccess?: () => void) {
      mutation.mutate(
         { channelBackgrounds: (channelBackgrounds ?? []).filter((background) => background.channelId !== channelId) },
         { onSuccess },
      );
   }

   return {
      background,
      backgroundScope,
      channelBackground,
      globalChannelBackground,
      saveChannelBackground,
      resetChannelBackground,
      isLoading: mutation.isPending,
   };
}
