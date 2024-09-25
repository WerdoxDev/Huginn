import { type ContextMenuRelationship, ContextMenuType } from "@/types";
import UserAvatarWithStatus from "@components/UserAvatarWithStatus";
import { Tooltip } from "@components/tooltip/Tooltip";
import { useContextMenu } from "@contexts/contextMenuContext";
import { type APIRelationUser, RelationshipType } from "@huginn/shared";
import type { Snowflake } from "@huginn/shared";

export default function FriendItem(props: {
	type: RelationshipType;
	user: APIRelationUser;
	onAccept?: (userId: Snowflake) => void;
	onDenyOrCancel?: (userId: Snowflake) => void;
	onMessage?: (userId: Snowflake) => void;
}) {
	const { open: openRelationshipMore } = useContextMenu<ContextMenuRelationship>(ContextMenuType.RELATIONSHIP_MORE);
	const { open: openRelationship } = useContextMenu<ContextMenuRelationship>(ContextMenuType.RELATIONSHIP);

	return (
		<div
			className="hover:bg-secondary group flex cursor-pointer items-center justify-between rounded-xl p-2.5"
			onContextMenu={(e) => {
				openRelationship({ user: props.user, type: props.type }, e);
			}}
		>
			<div className="flex">
				<UserAvatarWithStatus userId={props.user.id} avatarHash={props.user.avatar} className="mr-3" />
				<div className="flex flex-col items-start">
					<span className="text-text font-semibold">{props.user.displayName ?? props.user.username}</span>
					<span className="text-text/50 text-sm">Online (?)</span>
				</div>
			</div>
			<div className="flex flex-shrink-0 gap-x-2.5">
				{props.type === RelationshipType.PENDING_INCOMING || props.type === RelationshipType.PENDING_OUTGOING ? (
					<>
						{props.type === RelationshipType.PENDING_INCOMING && (
							<Tooltip>
								<Tooltip.Trigger
									className="bg-background/50 text-text/80 hover:text-primary group-hover:bg-background rounded-full p-2"
									onClick={() => props.onAccept?.(props.user.id)}
								>
									<IconMdiCheck className="size-5" />
								</Tooltip.Trigger>
								<Tooltip.Content>Accept</Tooltip.Content>
							</Tooltip>
						)}
						<Tooltip>
							<Tooltip.Trigger
								className="bg-background/50 text-text/80 hover:text-error group-hover:bg-background rounded-full p-2"
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
								className="bg-background/50 text-text/80 hover:text-text rounded-full p-2 active:bg-white/20"
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
								className="bg-background/50 text-text/80 hover:text-text rounded-full p-2 active:bg-white/20"
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
