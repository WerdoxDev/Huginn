import type { Snowflake } from "@huginn/shared";
import { useMutation } from "@tanstack/react-query";

export function useSendTyping() {
	const client = useClient();
	const canSend = useRef(true);
	const timeout = useRef<number>();

	const mutation = useMutation({
		mutationKey: ["send-typing"],
		async mutationFn(data: { channelId: Snowflake }) {
			if (canSend.current) {
				client.channels.typing(data.channelId);

				canSend.current = false;
				clearTimeout(timeout.current);

				timeout.current = window.setTimeout(() => {
					canSend.current = true;
				}, 5000);
			}
		},
	});

	function reset() {
		canSend.current = true;
		clearTimeout(timeout.current);
	}

	return { reset, mutation };
}
