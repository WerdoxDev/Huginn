import LoadingIcon from "@components/LoadingIcon";
import UserAvatar from "@components/UserAvatar";
import { useUser } from "@hooks/api-hooks/userHooks";
import { useMutationLatestState } from "@hooks/useLatestMutationStatus";
import type { GatewayVoiceState, Snowflake } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { useContextMenu } from "@stores/contextMenuStore";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore } from "@stores/voiceStore";
import clsx from "clsx";
import { motion, type Transition, type Variants } from "motion/react";
import { type MouseEvent, type RefObject, useEffect, useMemo, useRef, useState } from "react";
import type { RemoteSource } from "@/types";
import { VoiceLabel } from "./VoiceLabel";
import VoiceVideoStats from "./VoiceVideoStats";

export default function VoiceElement(props: {
	userId: Snowflake;
	channelId: Snowflake;
	remoteSource?: RemoteSource;
	gridElementWidth: number;
	isMaximized?: boolean;
	isResizing?: boolean;
	isGridView?: boolean;
	isRinging?: boolean;
	isSpeaking?: boolean;
	voiceState?: GatewayVoiceState;
	onClick?: (producerId: string) => void;
	onWatch?: (userId: Snowflake) => void;
	ref?: RefObject<HTMLDivElement>;
}) {
	const { open: openContextMenu } = useContextMenu("voice_element");
	const { remoteSources } = useVoiceStore();
	const videoRef = useRef<HTMLVideoElement>(null);
	const client = useClient();
	const { user: thisUser } = useThisUser();
	const user = useUser(props.userId);

	const [isVideoMetaLoaded, setIsVideoMetaLoaded] = useState(false);
	const consumeState = useMutationLatestState("consume-stream");

	const hasAudio = useMemo(
		() =>
			remoteSources.find((x) => x.kind === "stream_audio" && x.userId === props.userId) !== undefined ||
			(client.voice.producers.get("stream_audio") !== undefined && thisUser?.id === props.userId),
		[remoteSources, props.voiceState],
	);

	const isVideo = useMemo(() => props.remoteSource?.kind === "camera" || props.remoteSource?.kind === "stream_video", [props.remoteSource]);
	const isStream = useMemo(() => props.remoteSource?.kind === "stream_video" || props.remoteSource?.kind === "stream_audio", [props.remoteSource]);
	const isPreview = useMemo(
		() => isVideo && !props.remoteSource?.consumerId && props.userId !== thisUser?.id,
		[props.remoteSource?.srcObject, props.remoteSource?.consumerId, isVideo],
	);

	const isLoadingStream = useMemo(
		() => consumeState?.variables?.userId === props.userId && isStream && (consumeState.status === "pending" || !isVideoMetaLoaded),
		[consumeState?.status, isVideoMetaLoaded, isStream],
	);

	function watch(e: MouseEvent) {
		e.stopPropagation();
		props.onWatch?.(props.userId);
	}

	function onContextMenu(e: MouseEvent<HTMLDivElement>) {
		if (props.userId === thisUser?.id || !user || !props.remoteSource) {
			return;
		}

		openContextMenu(
			{
				user: user,
				producerId: props.remoteSource?.producerId,
				consumerId: props.remoteSource?.consumerId,
				kind: props.remoteSource?.kind,
				channelId: props.channelId,
			},
			e,
		);
	}

	useEffect(() => {
		console.log(consumeState?.status);
	}, [consumeState]);

	useEffect(() => {
		if (videoRef.current) {
			setIsVideoMetaLoaded(false);
			videoRef.current.srcObject = props.remoteSource?.srcObject ?? null;
			videoRef.current.onloadedmetadata = () => {
				setIsVideoMetaLoaded(true);
			};
		}
	}, [props.remoteSource?.srcObject]);

	const transition: Transition = {
		type: "spring",
		bounce: 0,
		damping: 26,
		stiffness: 200,
	};

	const variants: Variants = {
		visible: {
			scale: 1,
			opacity: 1,
			transition,
		},
		hidden: { scale: 0, opacity: 0, transition },
		exit: { scale: 0, opacity: 0, transition },
	};

	return (
		<motion.div
			layout={!props.isResizing}
			variants={variants}
			initial="hidden"
			animate="visible"
			exit="exit"
			transition={transition}
			ref={props.ref}
			onClick={() => props.onClick?.(props.remoteSource?.producerId ?? "")}
			style={{
				width: props.isGridView ? props.gridElementWidth : "auto",
				borderRadius: props.isMaximized ? "0px" : "12px",
			}}
			onContextMenu={onContextMenu}
			id={props.remoteSource?.consumerId}
			className={clsx(
				"group/element relative flex shrink-0 flex-col items-center justify-center gap-y-1 shadow-md transition-shadow hover:shadow-xl",
				props.onClick && "cursor-pointer",
				props.isGridView && "aspect-video overflow-hidden p-0",
				props.isSpeaking && "!ring-2 !ring-positive-100",
				props.isRinging ? "bg-surface/50" : "bg-surface",
				!props.isMaximized && "ring-2 ring-surface",
			)}
		>
			{!isVideo && (
				<div className={clsx("p-5", props.isRinging && "animate-pulse", props.isGridView && "flex h-full w-full items-center justify-center")}>
					<motion.div layout={!props.isResizing} transition={transition}>
						<UserAvatar userId={props.userId} avatarHash={user?.avatar} size={props.isGridView ? "5rem" : "4rem"} hideStatus />
					</motion.div>
				</div>
			)}
			{!isPreview && !isLoadingStream && isVideo && (
				<VoiceVideoStats
					hasAudio={hasAudio}
					isResizing={props.isResizing}
					kind={props.remoteSource?.kind}
					transition={transition}
					videoRef={videoRef}
					srcObject={props.remoteSource?.srcObject}
				/>
			)}
			<VoiceLabel
				kind={props.remoteSource?.kind}
				transition={transition}
				userId={props.userId}
				isResizing={props.isResizing}
				isGridView={props.isGridView}
				voiceState={props.voiceState}
			/>
			{isLoadingStream ? (
				<div className="absolute inset-0 flex items-center justify-center bg-black/60">
					<LoadingIcon className="size-12" />
				</div>
			) : (
				isPreview && (
					<button
						className="group/watch flex h-full w-full cursor-pointer items-center justify-center bg-black/80 transition-colors hover:bg-black/60"
						onClick={watch}
						type="button"
					>
						<motion.div
							layout={!props.isResizing ? "position" : false}
							transition={transition}
							className="rounded-xl bg-surface px-3 py-1.5 text-text transition-colors"
						>
							Watch Stream
						</motion.div>
					</button>
				)
			)}
			{!isPreview && isVideo && <video className="h-full w-full" ref={videoRef} autoPlay playsInline muted />}
		</motion.div>
	);
}
