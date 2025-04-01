import HuginnIcon from "@components/HuginnIcon";
import LoadingIcon from "@components/LoadingIcon";
import { useAuthBackground } from "@contexts/authBackgroundContext";
import { client } from "@stores/apiStore";
import { useModals } from "@stores/modalsStore";
import clsx from "clsx";
import { Outlet, redirect } from "react-router";
import type { Route } from "./+types/auth-layout";

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
	const force = new URL(request.url).searchParams.get("force") === "1";

	if (client?.isLoggedIn && !force) {
		throw redirect("/channels/@me");
	}
}

export default function Layout() {
	const authBackground = useAuthBackground();

	const { updateModals } = useModals();
	return (
		<div className={clsx("absolute inset-0", authBackground.state === 2 && "pointer-events-none")}>
			<div className={clsx("absolute inset-0 select-none transition-all duration-500", authBackground.state === 1 ? "opacity-100" : "opacity-0")}>
				<div className="flex h-full flex-col items-center justify-center">
					<HuginnIcon overrideTheme="text" className="size-20 animate-pulse text-text drop-shadow-[0px_0px_50px_rgb(var(--color-text))]" />
					<div className="mt-2 flex items-center justify-center gap-x-2 text-text/80 text-xl">
						<span>Loading</span>
						<LoadingIcon />
					</div>
				</div>
			</div>
			<div className="absolute flex h-full w-full items-center justify-center">
				<Outlet />
			</div>
			{authBackground.state !== 2 && (
				<button
					type="button"
					className="absolute right-2.5 bottom-2.5 rounded-lg p-1 transition-all hover:bg-background"
					onClick={() => {
						updateModals({ settings: { isOpen: true } });
					}}
				>
					<IconMingcuteSettings5Fill className="h-6 w-6 text-white/80 transition-all hover:rotate-[60deg]" />
				</button>
			)}
			{/* <div className="absolute top-10 left-10 flex flex-col items-center justify-center gap-y-5 rounded-xl bg-background p-5 shadow-xl">
				<HuginnIcon overrideTheme="text" className="hover:-rotate-12 size-20 text-accent transition-transform hover:scale-105 active:rotate-6" />
			</div> */}
		</div>
	);
}
