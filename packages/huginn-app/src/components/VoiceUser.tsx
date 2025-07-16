import type { APIPublicUser, GatewayVoiceState } from "@huginn/shared";
import { useContextMenu } from "@stores/contextMenuStore";
import { useThisUser } from "@stores/userStore";
import clsx from "clsx";
import { motion, type Transition, type Variants } from "motion/react";
import type { RefObject } from "react";
import UserAvatar from "./UserAvatar";

export default function VoiceUser(props: {
	user: APIPublicUser;
	voiceState?: GatewayVoiceState;
	isSpeaking?: boolean;
	isRinging?: boolean;
	isGridView: boolean;
	gridElementWidth: number;
	producerId?: string;
	isResizing?: boolean;
	ref?: RefObject<HTMLButtonElement>;
}) {
	const { open: openContextMenu } = useContextMenu("voice_user");
	const { user } = useThisUser();

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
			className={clsx(
				"group relative flex shrink-0 flex-col items-center justify-center gap-y-1 shadow-md transition-shadow hover:shadow-xl",
				props.isGridView && "aspect-video p-0",
				props.isSpeaking && "ring-2 ring-positive-100",
				props.isRinging ? "bg-surface/50" : "bg-surface",
			)}
			style={{ width: props.isGridView ? props.gridElementWidth : "auto", borderRadius: "12px" }}
			type="button"
			onContextMenu={
				props.user.id !== user?.id ? (e) => openContextMenu({ user: props.user, producerId: props.producerId, kind: "microphone" }, e) : undefined
			}
		>
			<div className={clsx("p-5", props.isRinging && "animate-pulse", props.isGridView && "flex h-full w-full items-center justify-center")}>
				<motion.div layout={!props.isResizing} transition={transition}>
					<UserAvatar userId={props.user.id} avatarHash={props.user.avatar} size={props.isGridView ? "5rem" : "4rem"} hideStatus />
				</motion.div>
			</div>
			<motion.div
				layout={!props.isResizing ? "position" : false}
				transition={transition}
				className={clsx("absolute bottom-2 left-2 flex overflow-hidden text-white")}
			>
				<div
					className={clsx(
						"flex h-7 items-center justify-center gap-x-2 rounded-lg bg-negative-300",
						(props.voiceState?.selfMute || props.voiceState?.selfDeaf) && "mr-2 p-1",
					)}
				>
					{props.voiceState?.selfMute && <IconMingcuteMicOffFill className="size-5" />}
					{props.voiceState?.selfDeaf && <IconMingcuteVolumeOffFill className="size-5" />}
				</div>
				{props.isGridView && (
					<div className="rounded-lg bg-surface-deep px-2 py-0.5 opacity-0 transition-opacity group-hover/wrapper:opacity-100">
						{props.user.displayName ?? props.user.username}
					</div>
				)}
			</motion.div>
			{!props.isGridView && (
				<motion.div
					layout={!props.isResizing}
					transition={transition}
					className={clsx(
						"-bottom-10 absolute w-full overflow-hidden text-ellipsis text-nowrap text-center text-text opacity-0 transition-opacity group-hover:opacity-100",
					)}
				>
					{props.user.displayName ?? props.user.username}
				</motion.div>
			)}
		</motion.button>
	);
}
