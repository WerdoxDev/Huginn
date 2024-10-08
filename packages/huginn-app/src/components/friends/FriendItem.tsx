import { type ContextMenuRelationship, ContextMenuType } from "@/types";
import UserAvatarWithStatus from "@components/UserAvatarWithStatus";
import { Tooltip } from "@components/tooltip/Tooltip";
import { useContextMenu } from "@contexts/contextMenuContext";
import { type APIRelationUser, RelationshipType } from "@huginn/shared";
import type { Snowflake, UserPresence } from "@huginn/shared";
import { useMemo } from "react";

export default function FriendItem(props: {
	type: RelationshipType;
	user: APIRelationUser;
	presence?: UserPresence;
	loading?: boolean;
	onAccept?: (userId: Snowflake) => void;
	onDenyOrCancel?: (userId: Snowflake) => void;
	onMessage?: (userId: Snowflake) => void;
}) {
	const { open: openRelationshipMore } = useContextMenu<ContextMenuRelationship>(ContextMenuType.RELATIONSHIP_MORE);
	const { open: openRelationship } = useContextMenu<ContextMenuRelationship>(ContextMenuType.RELATIONSHIP);

	const presenceText = useMemo(
		() =>
			!props.presence
				? "Offline"
				: props.presence?.status === "online"
					? "Online"
					: props.presence?.status === "offline"
						? "Offline"
						: props.presence?.status === "idle"
							? "Idle"
							: "Do not disturb",
		[props.presence],
	);

	return (
		<div
			className="group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-xl p-2.5 hover:bg-secondary"
			onContextMenu={(e) => {
				openRelationship({ user: props.user, type: props.type }, e);
			}}
			onClick={() => props.onMessage?.(props.user.id)}
		>
			<div className="flex">
				<UserAvatarWithStatus userId={props.user.id} avatarHash={props.user.avatar} className="mr-3" />
				<div className="flex flex-col items-start">
					<span className="font-semibold text-text">{props.user.displayName ?? props.user.username}</span>
					<span className="text-sm text-text/50">{presenceText}</span>
				</div>
			</div>
			{props.loading && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/40">
					<IconSvgSpinners3DotsFade className="size-10 text-text" />
				</div>
			)}
			<div className="flex flex-shrink-0 items-center gap-x-2.5">
				{props.type === RelationshipType.PENDING_INCOMING || props.type === RelationshipType.PENDING_OUTGOING ? (
					<>
						{props.type === RelationshipType.PENDING_INCOMING && (
							<Tooltip>
								<Tooltip.Trigger
									className="rounded-full bg-background/50 p-2 text-text/80 hover:text-primary group-hover:bg-background"
									onClick={() => props.onAccept?.(props.user.id)}
								>
									<IconMdiCheck className="size-5" />
								</Tooltip.Trigger>
								<Tooltip.Content>Accept</Tooltip.Content>
							</Tooltip>
						)}
						<Tooltip>
							<Tooltip.Trigger
								className="rounded-full bg-background/50 p-2 text-text/80 hover:text-error group-hover:bg-background"
								onClick={() => props.onDenyOrCancel?.(props.user.id)}
							>
								<IconMdiClose className="size-5" />
							</Tooltip.Trigger>
							<Tooltip.Content>{props.type === RelationshipType.PENDING_INCOMING ? "Ignore" : "Cancel"} </Tooltip.Content>
						</Tooltip>
					</>
				) : (
					<>
						<Tooltip>
							<Tooltip.Trigger
								onClick={() => props.onMessage?.(props.user.id)}
								className="rounded-full bg-background/50 p-2 text-text/80 hover:text-text active:bg-white/20"
							>
								<IconMdiMessage className="size-5" />
							</Tooltip.Trigger>
							<Tooltip.Content>Message</Tooltip.Content>
						</Tooltip>
						<Tooltip>
							<Tooltip.Trigger
								onClick={(e) => {
									openRelationshipMore({ user: props.user, type: props.type }, e);
								}}
								className="rounded-full bg-background/50 p-2 text-text/80 hover:text-text active:bg-white/20"
							>
								<IconMdiMoreVert className="size-5" />
							</Tooltip.Trigger>
							<Tooltip.Content>More</Tooltip.Content>
						</Tooltip>
					</>
				)}
			</div>
		</div>
	);
}
