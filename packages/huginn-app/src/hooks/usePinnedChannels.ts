import type { Snowflake } from "@huginnjs/shared";

import { clientStore, useClient } from "@stores/clientStore";
import { useCallback } from "react";
import { useStore } from "zustand";

import { useEditSettings } from "./mutations/useEditSettings";

export function usePinnedChannels(channelIds?: Snowflake[]) {
   const pinnedChannelIds = useStore(clientStore, (state) => state.userSettings?.pinnedChannels);
   const client = useClient();

   const isPinned = useCallback((id: Snowflake) => pinnedChannelIds?.includes(id), [pinnedChannelIds]);
   const mutation = useEditSettings();

   const togglePin = useCallback(
      async (id: Snowflake) => {
         const next = pinnedChannelIds?.includes(id) ? pinnedChannelIds.filter((x) => x !== id) : [...(pinnedChannelIds ?? []), id];

         // Remove IDs that no longer correspond to an open channel
         const cleaned = channelIds ? next.filter((x) => channelIds.includes(x)) : next;

         await mutation.mutateAsync({ pinnedChannels: cleaned });
      },
      [client, channelIds, pinnedChannelIds],
   );

   return { pinnedChannelIds, isPinned, togglePin };
}
