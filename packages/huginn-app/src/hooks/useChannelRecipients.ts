import type { Snowflake } from "@huginn/shared";
import { useQuery } from "@tanstack/react-query";

export function useChannelRecipients(channelId?: Snowflake, guildId?: Snowflake) {
	const client = useClient();
	const { data } = useQuery(getChannelsOptions(client, guildId ?? "@me"));

	const channel = useMemo(() => data?.find((x) => x.id === channelId), [data, channelId]);
	const recipients = useMemo(() => channel?.recipients, [data, channelId]);

	return { recipients, ownerId: channel?.ownerId };
}
