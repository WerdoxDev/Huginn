import type { APIPublicUser, HMediaKind } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { useContextMenu } from "@stores/contextMenuStore";
import { useThisUser } from "@stores/userStore";
import { useVoiceStore } from "@stores/voiceStore";
import clsx from "clsx";
import { motion, type Transition, type Variants } from "motion/react";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import LoadingIcon from "./LoadingIcon";

export default function VoiceVideo(props: {
	user: APIPublicUser;
	consumerId?: string;
	producerId?: string;
	kind: HMediaKind;
	gridElementWidth: number;
	srcObject?: MediaProvider;
	isMaximized?: boolean;
	isResizing?: boolean;
	onClick: (producerId: string) => void;
	ref?: RefObject<HTMLButtonElement>;
}) {
	const { open: openContextMenu } = useContextMenu("voice_user");
	const { remoteSources, localVoiceState: voiceState } = useVoiceStore();
	const videoRef = useRef<HTMLVideoElement>(null);
	const frameCallbackHandleRef = useRef<number | null>(null);
	const client = useClient();
	const { user } = useThisUser();

	const hasAudio = useMemo(
		() =>
			remoteSources.find((x) => x.kind === "screen_audio" && x.userId === props.user.id) !== undefined ||
			(client.voice.producers.get("screen_audio") !== undefined && user?.id === props.user.id),
		[remoteSources, voiceState],
	);

	const [height, setHeight] = useState(0);
	const [estimateFps, setEstimateFps] = useState(0);

	useEffect(() => {
		if (videoRef.current) {
			videoRef.current.srcObject = props.srcObject ?? null;
		}
	}, [props.srcObject]);

	useEffect(() => {
		if (!videoRef.current) {
			return;
		}

		let frames = 0;
		let start = performance.now();

		function countFrames(now: DOMHighResTimeStamp, _metadata: VideoFrameCallbackMetadata) {
			frames++;
			const elapsed = (now - start) / 1000;

			if (elapsed >= 1.0) {
				setEstimateFps(frames);
				frames = 0;
				start = now;
			}

			frameCallbackHandleRef.current = videoRef.current?.requestVideoFrameCallback(countFrames) ?? null;
		}

		function startCounting() {
			frames = 0;
			start = performance.now();

			frameCallbackHandleRef.current = videoRef.current?.requestVideoFrameCallback(countFrames) ?? null;
		}

		function stopCounting() {
			if (frameCallbackHandleRef.current !== null) {
				videoRef.current?.cancelVideoFrameCallback(frameCallbackHandleRef.current);
				frameCallbackHandleRef.current = null;
			}
		}

		videoRef.current.onloadedmetadata = () => {
			stopCounting();
			startCounting();
		};

		videoRef.current.onresize = () => {
			setHeight(videoRef.current?.videoHeight ?? 0);
		};

		return () => {
			stopCounting();

			if (videoRef.current) {
				videoRef.current.onloadedmetadata = null;
				videoRef.current.onresize = null;
			}
		};
	}, []);

	const transition: Transition = { type: "spring", bounce: 0, damping: 26, stiffness: 200 };

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
		<motion.button
			layout={!props.isResizing}
			variants={variants}
			initial="hidden"
			animate="visible"
			exit="exit"
			transition={transition}
			ref={props.ref}
			onClick={() => props.onClick(props.producerId ?? "")}
			style={{ width: props.gridElementWidth }}
			onContextMenu={
				props.user.id !== user?.id
					? (e) => openContextMenu({ user: props.user, producerId: props.producerId, kind: "screen_audio" }, e)
					: undefined
			}
			id={props.consumerId}
			type="button"
			className={clsx(
				"group relative flex aspect-video shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden bg-surface-deep",
				!props.isMaximized && "rounded-xl border-2 border-surface",
			)}
		>
			<motion.div
				layout={!props.isResizing ? "position" : false}
				transition={transition}
				className="absolute top-2 right-2 flex gap-x-2 rounded-lg bg-surface-deep px-2 py-1 italic opacity-0 transition-opacity group-hover:opacity-100"
			>
				{props.kind === "screen_video" &&
					(hasAudio ? (
						<IconMingcuteVolumeFill className="text-positive-100" />
					) : (
						<IconMingcuteVolumeOffFill className="size-5 text-negative-100" />
					))}
				<div className="font-bold text-sm text-white/90">
					{height}
					<span className="text-white/60">P</span> {estimateFps}
					<span className="text-white/60"> FPS</span>
				</div>
			</motion.div>
			<motion.div layout={!props.isResizing ? "position" : false} transition={transition} className="absolute bottom-2 left-2 flex gap-x-2">
				<div className="flex items-center justify-center gap-x-2 rounded-lg bg-surface-deep px-2 py-1 text-white opacity-0 transition-opacity group-hover/wrapper:opacity-100">
					{props.kind === "screen_video" ? <IconMingcuteMonitorFill className="size-5" /> : <IconMingcuteCamera2Fill className="size-5" />}
					{props.user.displayName ?? props.user.username}
				</div>
			</motion.div>
			{!props.srcObject ? <LoadingIcon /> : <video className="h-full w-full" ref={videoRef} autoPlay playsInline muted />}
		</motion.button>
	);
}
