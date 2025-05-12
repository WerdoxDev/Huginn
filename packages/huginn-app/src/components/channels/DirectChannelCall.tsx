import UserAvatar from "@components/UserAvatar";
import Tooltip from "@components/tooltip/Tooltip";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useLookup } from "@hooks/useLookup";
import type { Snowflake } from "@huginn/shared";
import { useClient } from "@stores/apiStore";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore } from "@stores/voiceStore";
import clsx from "clsx";
import { useMemo } from "react";

export default function DirectChannelCall(props: { channelId: Snowflake }) {
	const { voiceState, voiceStates, callStates, remoteSources, speakingStates } = useVoiceStore();

	const client = useClient();
	const { user } = useThisUser();

	const thisVoiceStates = useMemo(() => voiceStates.filter((x) => x.channelId === props.channelId), [voiceStates, props.channelId]);
	const thisCallState = useMemo(() => callStates.find((x) => x.channelId === props.channelId), [callStates, props.channelId]);

	const users = useUsers(Array.from(new Set([...(thisCallState?.ringing ?? []), ...thisVoiceStates.map((x) => x.userId)])));
	const usersLookup = useLookup(users, (user) => user.id);
	const usersSpeakingLookup = useLookup(speakingStates, (state) => state.userId);
	const show = useMemo(() => users.length !== 0 && thisCallState, [props.channelId, users]);

	function disconnect() {
		client.gateway.disconnectFromVoice();
	}

	function toggleMute() {
		client.gateway.updateVoiceState(!voiceState.selfMute, false);
	}

	function toggleDeafen() {
		client.gateway.updateVoiceState(!voiceState.selfDeaf, !voiceState.selfDeaf);
	}

	async function connect() {
		await client.gateway.connectToVoice(null, props.channelId);
	}

	if (!user || !show) {
		return;
	}

	return (
		<div className="z-10 m-2 mb-0 flex h-2/5 shrink-0 flex-col gap-y-3 rounded-xl bg-black/60 shadow-lg shadow-tertiary/50 ring-2 ring-primary/70">
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
							"relative flex flex-col items-center justify-center gap-y-3 rounded-xl bg-background p-3 shadow-md transition-shadow hover:shadow-xl",
							usersSpeakingLookup[x.userId]?.speaking && "ring-2 ring-success",
						)}
					>
						<UserAvatar userId={usersLookup[x.userId].id} avatarHash={usersLookup[x.userId].avatar} hideStatus size="5rem" />
						{(x.selfMute || x.selfDeaf) && (
							<div className="-bottom-5 -left-2 absolute flex gap-x-2 rounded-lg bg-error p-1.5">
								{x?.selfMute && <IconMingcuteMicOffFill className="size-4 text-white" />}
								{x?.selfDeaf && <IconMingcuteVolumeOffFill className="size-4 text-white" />}
							</div>
						)}
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
				{voiceState.channelId === props.channelId ? (
					<>
						<div className="flex gap-x-1 rounded-xl border border-background bg-tertiary p-1">
							<Tooltip>
								<Tooltip.Trigger
									className={clsx(
										"h-full w-full rounded-lg px-5 py-1.5 text-white transition-colors hover:bg-background",
										voiceState.selfMute && "bg-error/80 hover:bg-error/60",
									)}
									onClick={toggleMute}
								>
									{voiceState.selfMute ? <IconMingcuteMicOffFill className="size-6" /> : <IconMingcuteMicFill className="size-6" />}
								</Tooltip.Trigger>
								<Tooltip.Content>Mute</Tooltip.Content>
							</Tooltip>
							<Tooltip>
								<Tooltip.Trigger
									className={clsx(
										"h-full w-full rounded-lg px-5 py-1.5 text-white transition-colors hover:bg-background",
										voiceState.selfDeaf && "bg-error/80 hover:bg-error/60",
									)}
									onClick={toggleDeafen}
								>
									{voiceState.selfDeaf ? <IconMingcuteVolumeOffFill className="size-6" /> : <IconMingcuteVolumeFill className="size-6" />}
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
