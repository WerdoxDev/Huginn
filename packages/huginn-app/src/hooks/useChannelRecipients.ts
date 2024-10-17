import { useClient } from "@contexts/apiContext.tsx";
import type { Snowflake } from "@huginn/shared";
import { getChannelsOptions } from "@lib/queries.ts";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useChannelRecipients(channelId?: Snowflake, guildId?: Snowflake) {
	const client = useClient();
	const { data } = useQuery(getChannelsOptions(client, guildId ?? "@me"));

	const channel = useMemo(() => data?.find((x) => x.id === channelId), [data, channelId]);
	const recipients = useMemo(() => channel?.recipients, [data, channelId]);

	return { recipients, ownerId: channel?.ownerId };
}
