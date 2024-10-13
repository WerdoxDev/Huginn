import { useClient } from "@contexts/apiContext";
import type { Snowflake } from "@huginn/shared";
import { getChannelsOptions } from "@lib/queries";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useChannelRecipients(channelId?: Snowflake, guildId?: Snowflake) {
	const client = useClient();
	const { data } = useQuery(getChannelsOptions(client, guildId ?? "@me"));

	return useMemo(() => data?.find((x) => x.id === channelId)?.recipients, [data, channelId]);
}
