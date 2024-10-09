import UserAvatarWithStatus from "@components/UserAvatarWithStatus";
import { Transition } from "@headlessui/react";
import type { APIChannelUser } from "@huginn/shared";

export default function RecipientsSidebar(props: { recipients: APIChannelUser[]; visible: boolean }) {
	return (
		<div className="my-2 flex-shrink-0">
			<Transition show={props.visible}>
				<div className="mr-2 flex h-full w-56 flex-col gap-y-0.5 rounded-xl bg-secondary p-2 shadow-lg ring-2 ring-primary/50 transition-all duration-200 data-[closed]:m-0 data-[closed]:w-0 data-[closed]:p-0 data-[closed]:opacity-0">
					{props.recipients.map((x) => (
						<div key={x.id} className="flex items-center gap-x-3 rounded-lg p-1.5 hover:cursor-pointer hover:bg-background">
							<UserAvatarWithStatus userId={x.id} avatarHash={x.avatar} />
							<div className="text-text">{x.username}</div>
						</div>
					))}
				</div>
			</Transition>
		</div>
	);
}
