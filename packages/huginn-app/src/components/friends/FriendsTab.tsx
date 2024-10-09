import { TabPanel } from "@headlessui/react";
import { type CreateDMChannelMutationVars, useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { useLatestMutationState } from "@hooks/useLatestMutationStatus";
import type { APIRelationshipWithoutOwner, UserPresence } from "@huginn/shared";
import { useMemo } from "react";
import FriendItem from "./FriendItem";

export default function FriendsTab(props: { friends: APIRelationshipWithoutOwner[] | null; presences: UserPresence[]; text: string }) {
	const mutation = useCreateDMChannel();
	const state = useLatestMutationState<CreateDMChannelMutationVars>("create-dm-channel");

	const amount = useMemo(() => props.friends?.length ?? 0, [props.friends]);

	return (
		<TabPanel>
			<div className="ml-2.5 font-medium text-text/70 text-xs uppercase">
				{props.text} - {amount}
			</div>
			<div className="mt-5 flex flex-col justify-center gap-y-1">
				{props.friends?.map((friend) => (
					<FriendItem
						loading={state?.status === "pending" && state?.variables?.recipients.some((x) => x === friend.user.id)}
						onMessage={(userId) => mutation.mutate({ recipients: [userId] })}
						presence={props.presences.find((x) => x.user.id === friend.user.id)}
						key={friend.id}
						user={friend.user}
						type={friend.type}
					/>
				))}
			</div>
		</TabPanel>
	);
}
