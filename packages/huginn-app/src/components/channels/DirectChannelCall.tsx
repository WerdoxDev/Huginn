import UserAvatar from "@components/UserAvatar";
import Tooltip from "@components/tooltip/Tooltip";
import { useChannel } from "@hooks/api-hooks/channelHooks";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useLookup } from "@hooks/useLookup";
import type { Snowflake } from "@huginn/shared";
import { AudioLevelChecker } from "@lib/voice-client";
import { useClient } from "@stores/apiStore";
import { useSettings } from "@stores/settingsStore";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore } from "@stores/voiceStore";
import clsx from "clsx";
import { produce } from "immer";
import { useEffect, useMemo, useState } from "react";

export default function DirectChannelCall(props: { channelId: Snowflake }) {
	const [show, setShow] = useState(false);
	const { channelId, voiceStates, callStates, remoteSources } = useVoiceStore();

	const client = useClient();
	const settings = useSettings();
	const { user } = useThisUser();
	const channel = useChannel(props.channelId);
	const [speakingStates, setSpeakingStates] = useState<Array<{ userId: Snowflake; speaking: boolean }>>([]);
	// const audioLevel = useAudioLevel();

	const thisVoiceStates = useMemo(() => voiceStates.filter((x) => x.channelId === props.channelId), [voiceStates, props.channelId]);
	const thisCallState = useMemo(() => callStates.find((x) => x.channelId === props.channelId), [callStates, props.channelId]);

	const users = useUsers(Array.from(new Set([...(thisCallState?.ringing ?? []), ...thisVoiceStates.map((x) => x.userId)])));
	const usersLookup = useLookup(users, (user) => user.id);
	const usersSpeakingLookup = useLookup(speakingStates, (state) => state.userId);

	useEffect(() => {
		const audioLevels: AudioLevelChecker[] = [];
		for (const remoteSource of remoteSources) {
			const audioLevel = new AudioLevelChecker();
			audioLevels.push(audioLevel);

			audioLevel.startChecking(remoteSource.srcObject as MediaStream, settings.inputVolume);

			audioLevel.on("audio-level", (db: number) => {
				const speaking = db > (remoteSource.userId === user?.id ? settings.inputThreshold : Number.NEGATIVE_INFINITY);

				setSpeakingStates(
					produce((draft) => {
						const changeIndex = draft.findIndex((x) => x.userId === remoteSource.userId);
						if (changeIndex !== -1) {
							draft[changeIndex].speaking = speaking;
						} else {
							draft.push({
								userId: remoteSource.userId,
								speaking: speaking,
							});
						}
					}),
				);
			});
		}

		return () => {
			for (const audioLevel of audioLevels) {
				audioLevel.offAll("audio-level");
				audioLevel.stopChecking();
			}
		};
	}, [remoteSources, settings.inputThreshold]);

	useEffect(() => {
		console.log(speakingStates);
	}, [speakingStates]);

	useEffect(() => {
		if (users.length !== 0 && thisCallState) {
			setShow(true);
		} else {
			setShow(false);
		}
	}, [props.channelId, users]);

	function onAudioLevel(db: number) {}

	function disconnect() {
		client.voice.close();
		client.gateway.disconnectFromVoice();
	}

	async function connect() {
		await client.gateway.connectToVoice(null, props.channelId);
	}

	if (!user) {
		return;
	}

	return (
		<div
			className={clsx(
				"z-10 m-2 mb-0 flex h-2/5 shrink-0 flex-col rounded-xl bg-black/60 shadow-lg shadow-tertiary/50 ring-2 ring-primary/70",
				show ? "block" : "hidden",
			)}
		>
			<div className="flex h-full w-full shrink items-center justify-center gap-5">
				{/* {remoteSources.some((x) => x.kind === "video")
					? remoteSources.map((x) => (
							<div key={x.consumerId} className="aspect-video max-h-full min-w-0">
								<video
									className="rounded-lg"
									ref={(el) => {
										if (el) {
											el.srcObject = x.srcObject;
										}
									}}
									autoPlay
									playsInline
									muted
								/>
							</div>
						))
					:} */}
				{thisCallState?.ringing.map((x) => (
					<div
						key={x}
						className="flex flex-col items-center justify-center gap-y-3 rounded-xl bg-background/30 p-3 shadow-md transition-shadow hover:shadow-xl"
					>
						<UserAvatar userId={usersLookup[x].id} avatarHash={usersLookup[x].avatar} hideStatus size="5rem" />
						<div className="text-text">{usersLookup[x].displayName ?? usersLookup[x].username}</div>
					</div>
				))}
				{thisVoiceStates.map((x) => (
					<div
						key={x.userId}
						className={clsx(
							"flex flex-col items-center justify-center gap-y-3 rounded-xl bg-background p-3 shadow-md transition-shadow hover:shadow-xl",
							usersSpeakingLookup[x.userId]?.speaking && "ring-2 ring-success",
						)}
					>
						<UserAvatar userId={usersLookup[x.userId].id} avatarHash={usersLookup[x.userId].avatar} hideStatus size="5rem" />
						<div className="text-text">{usersLookup[x.userId].displayName ?? usersLookup[x.userId].username}</div>
					</div>
				))}
				{/* {remoteSources
					.filter((x) => x.kind === "audio" && x.userId !== user.id)
					.map((x) => (
						<audio
							key={x.consumerId}
							ref={(el) => {
								if (el) {
									el.srcObject = x.srcObject;
								}
							}}
							autoPlay
							playsInline
						/>
					))} */}
			</div>
			<div className="mb-2.5 flex shrink-0 items-center justify-center gap-x-2.5">
				{channelId === props.channelId ? (
					<>
						<div className="flex gap-x-1 rounded-xl border border-background bg-tertiary p-1">
							<Tooltip>
								<Tooltip.Trigger className="h-full w-full rounded-lg px-5 py-1.5 text-white transition-colors hover:bg-background">
									<IconMingcuteMicFill className="size-6" />
								</Tooltip.Trigger>
								<Tooltip.Content>Mute</Tooltip.Content>
							</Tooltip>
							<Tooltip>
								<Tooltip.Trigger className="h-full w-full rounded-lg px-5 py-1.5 text-white transition-colors hover:bg-background">
									<IconMingcuteVolumeFill className="size-6" />
								</Tooltip.Trigger>
								<Tooltip.Content>Deafen</Tooltip.Content>
							</Tooltip>
						</div>
						<Tooltip>
							<Tooltip.Trigger
								onClick={disconnect}
								className="rounded-xl bg-error/80 px-5 py-2.5 text-white transition-colors hover:bg-error/60"
							>
								<IconMingcutePhoneBlockFill className="size-6" />
							</Tooltip.Trigger>
							<Tooltip.Content>Disconnect</Tooltip.Content>
						</Tooltip>
					</>
				) : (
					<Tooltip>
						<Tooltip.Trigger
							onClick={connect}
							className="rounded-xl bg-success/80 px-5 py-2.5 text-white transition-colors hover:bg-success/60"
						>
							<IconMingcutePhoneFill className="size-6" />
						</Tooltip.Trigger>
						<Tooltip.Content>Join</Tooltip.Content>
					</Tooltip>
				)}
			</div>
		</div>
	);
}
