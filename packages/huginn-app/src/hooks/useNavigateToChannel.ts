import type { Snowflake } from "@huginn/shared";
import { useNavigate } from "react-router";

export default function useNavigateToChannel() {
	const navigate = useNavigate();

	async function navigateToChannel(guildId: Snowflake, channelId: Snowflake) {
		await navigate(`/channels/${guildId}/${channelId}`);
	}

	return navigateToChannel;
}
