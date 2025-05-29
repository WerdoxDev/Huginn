import RangeInput from "@components/input/RangeInput";
import { dispatchEvent } from "@lib/event-handler";
import { useContextMenu } from "@stores/contextMenuStore";
import { useVoiceStore } from "@stores/voiceStore";
import { useEffect, useMemo } from "react";
import ContextMenu from "./ContextMenu";

export default function VoiceUserContextMenu() {
	const { data } = useContextMenu("voice_user");
	const { updateVoicePreferences, voicePreferences } = useVoiceStore();

	const preference = useMemo(() => voicePreferences.find((x) => x.userId === data?.user.id), [voicePreferences]);

	function onChange(value: number) {
		if (!data) {
			return;
		}

		updateVoicePreferences(data.user.id, data.kind === "microphone" ? { microphoneVolume: value } : { screenshareVolume: value });
		console.log("CHANGED TO", value);
		dispatchEvent("voice_preference_changed", { userId: data.user.id });
	}

	if (!data || !preference) return;

	return (
		<>
			{/* <ContextMenu.Item label={data.producerId ?? "NOPE"} /> */}
			{/* <ContextMenu.Divider /> */}
			{data.kind === "microphone" && (
				<ContextMenu.Item
					label="Volume"
					className="!items-start focus:!bg-inherit mt-1 min-w-40 cursor-default flex-col gap-y-1 px-1"
					preventClose
				>
					<RangeInput minValue={0} maxValue={200} defaultValue={preference?.microphoneVolume} onChange={onChange} />
				</ContextMenu.Item>
			)}
			{data.kind === "screen_audio" && (
				<ContextMenu.Item
					label="Stream Volume"
					className="!items-start focus:!bg-inherit mt-1 min-w-40 cursor-default flex-col gap-y-1 px-1"
					preventClose
				>
					<RangeInput minValue={0} maxValue={200} defaultValue={preference?.screenshareVolume} onChange={onChange} />
				</ContextMenu.Item>
			)}
			{/* <ContextMenu.Divider /> */}
			{/* <ContextMenu.Item label="Text" /> */}
		</>
	);
}
