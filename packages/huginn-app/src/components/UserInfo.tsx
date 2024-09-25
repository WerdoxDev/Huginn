import { useModalsDispatch } from "@contexts/modalContext";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { useLogout } from "@hooks/useLogout";
import type { APIUser } from "@huginn/shared";
import { useMutation } from "@tanstack/react-query";
import UserAvatarWithStatus from "./UserAvatarWithStatus";
import { Tooltip } from "./tooltip/Tooltip";

export default function UserInfo(props: { user: APIUser }) {
	const modalsDispatch = useModalsDispatch();
	const logout = useLogout();

	const mutation = useMutation({
		async mutationFn() {
			await logout(true);
		},
	});

	function openSettings(e: React.MouseEvent) {
		e.stopPropagation();
		modalsDispatch({ settings: { isOpen: true } });
	}

	return (
		<section className=" flex h-16 w-64 flex-shrink-0 flex-grow-0 items-center justify-center">
			<Menu>
				<MenuButton as="div" className="group flex w-full cursor-pointer items-center rounded-xl px-2 py-1 hover:bg-white hover:bg-opacity-5">
					<UserAvatarWithStatus userId={props.user.id} avatarHash={props.user.avatar} className="mr-3 flex-shrink-0" />

					<div className="flex w-full flex-col items-start gap-y-0.5">
						<div className="text-text text-sm">{props.user.displayName ?? props.user.username}</div>
						<div className="text-text/70 text-xs">Online</div>
					</div>
					<div className="flex flex-shrink-0 gap-x-1">
						<Tooltip>
							<Tooltip.Trigger className="group/setting hover:bg-background rounded-lg p-1" onClick={openSettings}>
								<IconMdiSettings className="h-6 w-6 text-white/80 transition-all group-hover/setting:rotate-[60deg]" />
							</Tooltip.Trigger>
							<Tooltip.Content>User Settings</Tooltip.Content>
						</Tooltip>
					</div>
				</MenuButton>

				<Transition>
					<MenuItems
						className="divide-secondary w-60 divide-y rounded-lg bg-zinc-900 shadow-lg outline-none transition [--anchor-gap:0.5rem] data-[closed]:scale-95 data-[closed]:opacity-0"
						anchor="top"
					>
						<div className="p-1.5">
							<MenuItem>
								<button
									type="button"
									className="text-error hover:bg-error/10 flex w-full items-center gap-x-2.5 rounded-md px-2 py-2"
									onClick={() => {
										mutation.mutate();
									}}
								>
									<IconMdiLogout className="h-5 w-5" />
									<span className="text-sm">Logout</span>
								</button>
							</MenuItem>
						</div>
						<div className="p-1.5">
							<MenuItem>
								<button className="text-text hover:bg-secondary flex w-full items-center gap-x-2.5 rounded-md px-2 py-2" type="button">
									<IconMdiIdentificationCard className="h-5 w-5" />
									<span className="text-sm">Copy User ID</span>
								</button>
							</MenuItem>
						</div>
					</MenuItems>
				</Transition>
			</Menu>
		</section>
	);
}
