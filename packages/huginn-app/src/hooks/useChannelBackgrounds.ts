import type { Snowflake } from "@huginnjs/api";
import type { ChannelBackground } from "@huginnjs/shared";

import { clientStore } from "@stores/clientStore";
import { useCallback, useMemo } from "react";
import { useStore } from "zustand";

import { useEditSettings } from "./mutations/useEditSettings";

export function useChannelBackgrounds(channelId: Snowflake) {
   const storeChannelBackgrounds = useStore(clientStore, (state) => state.userSettings?.channelBackgrounds);
   const mutation = useEditSettings();

   const saveChannelBackground = useCallback(
      async (background: ChannelBackground) => {
         await mutation.mutateAsync({
            channelBackgrounds: [...(storeChannelBackgrounds ?? []).filter((x) => x.channelId !== background.channelId), background],
         });
      },
      [storeChannelBackgrounds],
   );

   const resetChannelBackground = useCallback(
      async (channelId: Snowflake) => {
         await mutation.mutateAsync({ channelBackgrounds: (storeChannelBackgrounds ?? []).filter((x) => x.channelId !== channelId) });
      },
      [storeChannelBackgrounds],
   );

   const getChannelBackground = useCallback(
      (channelId: Snowflake) => {
         return storeChannelBackgrounds?.find((x) => x.channelId === channelId);
      },
      [storeChannelBackgrounds],
   );

   const background = useMemo(() => (channelId ? getChannelBackground(channelId) : null), [channelId, getChannelBackground, storeChannelBackgrounds]);

   return { saveChannelBackground, resetChannelBackground, getChannelBackground, background, isLoading: mutation.isPending };
}
