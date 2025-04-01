import UserAvatar from "@components/UserAvatar";
import Tooltip from "@components/tooltip/Tooltip";
import { useChannel } from "@hooks/api-hooks/channelHooks";
import { useUser, useUsers } from "@hooks/api-hooks/userHooks";
import { useLookup } from "@hooks/useLookup";
import type { APIPublicUser, Snowflake, VoiceEvents } from "@huginn/shared";
import { useClient } from "@stores/apiStore";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore } from "@stores/voiceStore";
import clsx from "clsx";
import { useEffect, useState } from "react";

export default function DirectChannelCall(props: { channelId: Snowflake }) {
	const [show, setShow] = useState(false);
	const { channelId, addRemoteSource, removeRemoteSource, connectedUsers, remoteSources, clearRemoteSources } = useVoiceStore();

	const client = useClient();
	const { user } = useThisUser();
	const channel = useChannel(props.channelId);

	const users = useUsers(connectedUsers.filter((x) => x.channelId === props.channelId).map((x) => x.userId));
	const usersLookup = useLookup(users, (user) => user.id);

	useEffect(() => {
		setShow(users.length !== 0);
	}, [users]);

	useEffect(() => {
		if (client.voice.connectionInfo?.channelId !== props.channelId) {
			setShow(false);
		} else {
			setShow(true);
		}
	}, [props.channelId]);

	async function transportReady(d: VoiceEvents["transport_ready"]) {
		if (!user) {
			return;
		}

		const localStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: false,
		});

		// videoRef.current.srcObject = localStream;

		addRemoteSource(user.id, "0", "0", "audio", localStream);
		// setRemoteSources((old) => [...old, { consumerId: "0", producerId: "0", kind: "audio", srcObject: localStream, user: user }]);

		const audioTrack = localStream.getAudioTracks()[0];
		const videoTrack = localStream.getVideoTracks()[0];

		await client.voice.startStreaming(undefined, audioTrack);
	}

	async function producerCreated(d: VoiceEvents["producer_created"]) {
		const remoteStream = new MediaStream([d.track]);

		addRemoteSource(d.producerUserId, d.consumerId, d.producerId, d.track.kind === "video" ? "video" : "audio", remoteStream);
	}

	function producerRemoved(d: { producerId: string }) {
		removeRemoteSource(d.producerId);
	}

	function disconnect() {
		client.voice.close();
		client.gateway.disconnectFromVoice();
		clearRemoteSources();
	}

	async function connect() {
		await client.gateway.connectToVoice(null, props.channelId);
	}

	useEffect(() => {
		client.voice.on("transport_ready", transportReady);
		client.voice.on("producer_created", producerCreated);
		client.voice.on("producer_removed", producerRemoved);

		return () => {
			client.voice.off("transport_ready", transportReady);
			client.voice.off("producer_created", producerCreated);
			client.voice.off("producer_removed", producerRemoved);
		};
	}, []);

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
				{connectedUsers.map((x) => (
					<div
						key={x.userId}
						className="flex flex-col items-center justify-center gap-y-3 rounded-xl bg-background p-3 shadow-md transition-shadow hover:shadow-xl"
					>
						<UserAvatar userId={usersLookup[x.userId].id} avatarHash={usersLookup[x.userId].avatar} hideStatus size="5rem" />
						<div className="text-text">{usersLookup[x.userId].displayName ?? usersLookup[x.userId].username}</div>
					</div>
				))}
				{remoteSources
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
					))}
			</div>
			<div className="mb-2.5 flex shrink-0 items-center justify-center gap-x-2.5">
				{channelId ? (
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
