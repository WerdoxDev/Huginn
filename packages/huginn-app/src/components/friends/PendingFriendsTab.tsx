import { useClient } from "@contexts/apiContext";
import { TabPanel } from "@headlessui/react";
import { type APIRelationshipWithoutOwner, RelationshipType } from "@huginn/shared";
import type { Snowflake } from "@huginn/shared";

export default function PendingFriendsTab(props: { friends: APIRelationshipWithoutOwner[] }) {
	const createMutation = useCreateRelationship();
	const removeMutation = useRemoveRelationship();

	const pendingFriends = useMemo(
		() => props.friends.filter((x) => x.type === RelationshipType.PENDING_INCOMING || x.type === RelationshipType.PENDING_OUTGOING),
		[props.friends],
	);

	const pendingAmount = useMemo(() => pendingFriends.length, [pendingFriends]);

	function denyOrCancelRelationship(userId: Snowflake) {
		removeMutation.mutate(userId);
	}

	function acceptRelationship(userId: Snowflake) {
		createMutation.mutate({ userId });
	}
	return (
		<TabPanel>
			<div className="ml-2.5 font-medium text-text/70 text-xs uppercase">Pending - {pendingAmount}</div>
			<div className="mt-5 flex flex-col justify-center gap-y-1">
				{pendingFriends.map((friend) => (
					<FriendItem
						key={friend.id}
						type={friend.type}
						user={friend.user}
						onDenyOrCancel={denyOrCancelRelationship}
						onAccept={acceptRelationship}
					/>
				))}
			</div>
		</TabPanel>
	);
}
