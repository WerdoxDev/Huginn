import { TabPanel } from "@headlessui/react";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { type APIRelationshipWithoutOwner, RelationshipType } from "@huginn/shared";
import { useMemo } from "react";
import FriendItem from "./FriendItem";

export default function OnlineFriendsTab(props: { friends: APIRelationshipWithoutOwner[] | null }) {
	const mutation = useCreateDMChannel();

	const onlineFriends = useMemo(() => props.friends?.filter((x) => x.type === RelationshipType.FRIEND), [props.friends]);
	const onlineAmount = useMemo(() => onlineFriends?.length, [onlineFriends]);

	return (
		<TabPanel>
			<div className="text-text/70 ml-2.5 text-xs font-medium uppercase">Online - {onlineAmount}</div>
			<div className="mt-5 flex flex-col justify-center gap-y-1">
				{onlineFriends?.map((friend) => (
					<FriendItem
						onMessage={(userId) => mutation.mutateAsync({ recipients: [userId] })}
						key={friend.id}
						user={friend.user}
						type={friend.type}
					/>
				))}
			</div>
		</TabPanel>
	);
}
