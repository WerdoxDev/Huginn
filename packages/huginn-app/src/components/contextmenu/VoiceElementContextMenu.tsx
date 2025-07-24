import RangeInput from "@components/input/RangeInput";
import { useClient } from "@stores/clientStore";
import { useContextMenu } from "@stores/contextMenuStore";
import { useVoiceStore, voiceClient } from "@stores/voiceStore";
import { useEffect, useMemo } from "react";
import ContextMenu from "./ContextMenu";

export default function VoiceElementContextMenu() {
	const { data } = useContextMenu("voice_element");
	const client = useClient();
	const { updateVoicePreferences, voicePreferences, remoteSources, saveVoicePreferences } = useVoiceStore();

	const preference = useMemo(() => voicePreferences.find((x) => x.userId === data?.user.id), [voicePreferences]);

	const hasAudio = useMemo(
		() => data?.kind === "stream_video" && remoteSources.some((x) => x.kind === "stream_audio" && x.userId === data.user.id),
		[remoteSources, data],
	);

	const isWatching = useMemo(() => remoteSources.some((x) => x.producerId === data?.producerId && data.consumerId), [data, remoteSources]);

	function onChange(value: number) {
		if (!data) {
			return;
		}

		updateVoicePreferences(data.user.id, data.kind === "microphone" ? { microphoneVolume: value } : { screenshareVolume: value });
	}

	async function watch() {
		if (!data) {
			return;
		}

		if (client.voice.status === "authenticated") {
			await voiceClient.consumeStream(data.user.id);
		} else {
			await voiceClient.connectAndConsumeStream(null, data?.channelId, data?.user.id);
		}
	}

	useEffect(() => {
		return () => {
			saveVoicePreferences();
		};
	}, []);

	if (!data || !preference) return;

	return (
		<>
			{data.kind === "microphone" && (
				<ContextMenu.Item
					label="Volume"
					className="!items-start focus:!bg-inherit mt-1 min-w-40 cursor-default flex-col gap-y-1 px-1"
					preventClose
				>
					<RangeInput minValue={0} maxValue={200} defaultValue={preference?.microphoneVolume} onChange={onChange} />
				</ContextMenu.Item>
			)}
			{data.kind === "stream_video" && (
				<>
					{isWatching ? (
						<ContextMenu.Item label="Stop Watching" color="negative" onClick={() => voiceClient.unconsumeStream(data.user.id)} />
					) : (
						<ContextMenu.Item label="Watch" onClick={watch} />
					)}
					{hasAudio && (
						<ContextMenu.Item
							label="Stream Volume"
							className="!items-start focus:!bg-inherit mt-1 min-w-40 cursor-default flex-col gap-y-1 px-1"
							preventClose
						>
							<RangeInput minValue={0} maxValue={200} defaultValue={preference?.screenshareVolume} onChange={onChange} />
						</ContextMenu.Item>
					)}
				</>
			)}
		</>
	);
}
