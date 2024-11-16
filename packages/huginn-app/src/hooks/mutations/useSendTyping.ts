import type { Snowflake } from "@huginn/shared";
import { useMutation } from "@tanstack/react-query";
import type { KeyboardEvent } from "react";

function isPrintableKey(event: KeyboardEvent) {
	const key = event.key;
	// Exclude special keys
	const nonPrintableKeys = [
		"Shift",
		"Control",
		"Alt",
		"Meta",
		"CapsLock",
		"Tab",
		"ArrowUp",
		"ArrowDown",
		"ArrowLeft",
		"ArrowRight",
		"Escape",
		"Enter",
		"Backspace",
		"Delete",
		"Insert",
		"Home",
		"End",
		"PageUp",
		"PageDown",
		"ContextMenu",
		"F1",
		"F2",
		"F3",
		"F4",
		"F5",
		"F6",
		"F7",
		"F8",
		"F9",
		"F10",
		"F11",
		"F12",
	];

	return key.length === 1 || !nonPrintableKeys.includes(key);
}

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

	function mutate(event: KeyboardEvent, data: { channelId: Snowflake }) {
		if (event.ctrlKey || event.altKey || event.metaKey || !isPrintableKey(event)) return;

		mutation.mutate(data);
	}

	function reset() {
		canSend.current = true;
		clearTimeout(timeout.current);
	}

	return { reset, mutate };
}
