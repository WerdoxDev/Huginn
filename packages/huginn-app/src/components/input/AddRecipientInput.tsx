import type { AppRelationship } from "@/types";
import UserAvatar from "@components/UserAvatar";
import { Checkbox } from "@headlessui/react";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { type APIRelationUser, type APIRelationshipWithoutOwner, RelationshipType, type Snowflake } from "@huginn/shared";
import { useMemo, useState } from "react";
import ComboboxInput from "./ComboboxInput";
import HuginnInput from "./HuginnInput";

export default function AddRecipientInput(props: {
	label?: string;
	relationships?: AppRelationship[];
	onSelectionChanged?: (values: APIRelationUser[]) => void;
}) {
	const [query, setQuery] = useState("");

	const [selectedUsers, setSelectedUsers] = useState<Snowflake[]>([]);
	const toAddUsers = useUsers(selectedUsers);
	const relationshipUsers = useUsers(props.relationships?.filter((x) => x.type === RelationshipType.FRIEND).map((x) => x.userId));

	const filteredUsers = useMemo(
		() => relationshipUsers?.filter((x) => (query ? x.displayName?.includes(query) || x.username.includes(query) : true)),
		[query, relationshipUsers],
	);

	function selectionChanged(values: Snowflake[]) {
		setSelectedUsers(values);
		props.onSelectionChanged?.(relationshipUsers?.filter((x) => values.includes(x.id)) ?? []);
	}

	return (
		<ComboboxInput
			onSelectionChange={selectionChanged}
			selection={selectedUsers}
			status={{ code: "none", text: "" }}
			onChange={(e) => setQuery(e.target.value)}
		>
			<HuginnInput.Label className="mb-2" text={props.label ?? "Members"} />
			<HuginnInput.Wrapper border="left" className="!items-start flex-col">
				<ComboboxInput.SelectionDisplay>
					{({ toggleSelection }) => (
						<div className="mx-2 mt-2 flex select-none flex-wrap gap-1">
							{toAddUsers?.map((user) => (
								<button type="button" onClick={() => toggleSelection(user.id)} key={user.id} className="rounded-sm bg-primary px-2 text-text">
									{user.displayName ?? user.username}
								</button>
							))}
						</div>
					)}
				</ComboboxInput.SelectionDisplay>
				<HuginnInput.Input className="w-full" />
			</HuginnInput.Wrapper>
			<ComboboxInput.OptionWrapper>
				{query && filteredUsers?.length === 0 ? (
					<div className="flex h-full w-full items-center justify-center text-text">No friends matched your search!</div>
				) : (
					filteredUsers?.length === 0 && (
						<div className="flex h-full w-full items-center justify-center text-text">You don't have any eligible friends!</div>
					)
				)}
				{filteredUsers?.map((x) => (
					<ComboboxInput.Option value={x.id} key={x.id}>
						<UserAvatar userId={x.id} avatarHash={x.avatar} />
						<div className="overflow-hidden text-ellipsis text-nowrap text-text">{x.displayName ?? x.username}</div>
						<div className="text-sm text-text/70">{x.username}</div>
						<Checkbox
							checked={selectedUsers?.includes(x.id) ?? false}
							className="ml-auto size-6 shrink-0 rounded-md border border-accent data-[checked]:bg-accent "
						/>
					</ComboboxInput.Option>
				))}
			</ComboboxInput.OptionWrapper>
		</ComboboxInput>
	);
}
