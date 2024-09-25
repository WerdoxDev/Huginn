import { constants, type APIChannelUser } from "@huginn/shared";
import { useMemo } from "react";

export function useChannelName(recipients?: APIChannelUser[], name?: string | null, maxLength: number = constants.CHANNEL_NAME_MAX_LENGTH) {
	const channelName = useMemo(() => (name ? name : recipients?.map((x) => x.displayName ?? x.username).join(", ")), [name, recipients]);

	return channelName ? (channelName.length > maxLength ? `${channelName.slice(0, maxLength - 3)}...` : channelName) : "";
}
