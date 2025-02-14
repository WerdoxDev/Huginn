import type { APIChannelUser } from "@huginn/shared";
import { useMemo } from "react";

export function useChannelName(recipients?: APIChannelUser[], name?: string | null) {
	const channelName = useMemo(() => (name ? name : recipients?.map((x) => x.displayName ?? x.username).join(", ")), [name, recipients]);
	return channelName ?? "";
}
