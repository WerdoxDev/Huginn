import { APIDMChannel, APIGroupDMChannel } from "@huginn/shared";
import { useMemo } from "react";

export function useChannelName(channel: APIDMChannel | APIGroupDMChannel) {
   const name = useMemo(
      () => ("name" in channel && channel.name ? channel.name : channel.recipients.map(x => x.displayName ?? x.username).join(", ")),
      [channel],
   );

   return name;
}
