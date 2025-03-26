import UserAvatar from "@components/UserAvatar";
import { useClient } from "@contexts/apiContext";
import { useUser } from "@contexts/userContext";
import { useChannel } from "@hooks/useChannel";
import type { APIPublicUser, Snowflake, VoiceEvents } from "@huginn/shared";
import clsx from "clsx";
import { useEffect, useState } from "react";

export default function DirectChannelCall(props: { channelId: Snowflake }) {
	const [show, setShow] = useState(false);
	const [remoteSources, setRemoteSources] = useState<
		Array<{ kind: "video" | "audio"; consumerId: string; producerId: string; user?: APIPublicUser; srcObject: MediaProvider }>
	>([
		// { consumerId: "123", kind: "video", producerId: "123", srcObject: {} },
		// { consumerId: "1235", kind: "video", producerId: "1235", srcObject: {} },
		// { consumerId: "15235", kind: "video", producerId: "15235", srcObject: {} },
		// { consumerId: "12365", kind: "video", producerId: "12365", srcObject: {} },
		// { consumerId: "1234", kind: "audio", producerId: "1234", srcObject: {} },
	]);

	const client = useClient();
	const { user } = useUser();
	const channel = useChannel(props.channelId);

	useEffect(() => {
		// if (client.voice.connectionInfo?.channelId !== props.channelId) {
		// 	return;
		// }

		setRemoteSources((old) => old.map((x) => ({ ...x, user: x.user ? (channel?.recipients.find((y) => y.id === x.user?.id) ?? x.user) : x.user })));
	}, [channel?.recipients, user]);

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

		if (d.channelId === props.channelId) {
			setShow(true);
		}

		const localStream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: false,
		});

		// videoRef.current.srcObject = localStream;

		setRemoteSources((old) => [...old, { consumerId: "0", producerId: "0", kind: "audio", srcObject: localStream, user: user }]);

		const audioTrack = localStream.getAudioTracks()[0];
		const videoTrack = localStream.getVideoTracks()[0];

		await client.voice.startStreaming(undefined, audioTrack);
	}

	async function producerCreated(d: VoiceEvents["producer_created"]) {
		const remoteStream = new MediaStream([d.track]);
		const channelRecipient = channel?.recipients.find((x) => x.id === d.producerUserId);

		if (!channelRecipient) {
			return;
		}

		setRemoteSources((old) => [
			...old,
			{
				kind: d.track.kind === "video" ? "video" : "audio",
				consumerId: d.consumerId,
				producerId: d.producerId,
				user: channelRecipient,
				srcObject: remoteStream,
			},
		]);
	}

	function producerRemoved(d: { producerId: string }) {
		setRemoteSources((old) => old.filter((x) => x.producerId !== d.producerId));
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
				"z-10 m-2 mb-0 h-2/5 shrink-0 rounded-xl bg-secondary shadow-lg shadow-tertiary/50 ring-2 ring-primary/70",
				show ? "block" : "hidden",
			)}
		>
			<div className="flex h-full w-full items-center justify-center gap-5 px-5 py-5">
				{remoteSources.some((x) => x.kind === "video")
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
					: remoteSources.map((x) => (
							<div
								key={x.consumerId}
								className="flex flex-col items-center justify-center gap-y-3 rounded-xl bg-background p-3 shadow-md transition-shadow hover:shadow-xl"
							>
								<UserAvatar userId={x.user?.id ?? user?.id} avatarHash={x.user?.avatar ?? user.avatar} hideStatus size="5rem" />
								<div className="text-text">{x.user?.displayName ?? user.displayName}</div>
							</div>
						))}
				{remoteSources
					.filter((x) => x.kind === "audio")
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
		</div>
	);
}
