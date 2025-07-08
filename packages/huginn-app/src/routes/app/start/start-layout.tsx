import { useStartBackground } from "@contexts/authBackgroundContext";
import { useModals } from "@stores/modalsStore";
import clsx from "clsx";
import { type LoaderFunctionArgs, Outlet } from "react-router";

export async function startLoader({ request }: LoaderFunctionArgs) {
	// const force = new URL(request.url).searchParams.get("skip-check") === "1";
	// console.log(request.url);
	// if (client?.isLoggedIn && !force) {
	// 	throw redirect("/channels/@me");
	// }
}

export default function StartLayout() {
	const startBackground = useStartBackground();

	const { updateModals } = useModals();
	return (
		<div className={clsx("absolute inset-0", startBackground.state === 2 && "pointer-events-none")}>
			<div className="absolute flex h-full w-full items-center justify-center">
				<Outlet />
			</div>
			{/* {startBackground.state !== 2 && (
			)} */}
			<button
				type="button"
				className="absolute right-2.5 bottom-2.5 z-10 cursor-pointer rounded-lg p-1 transition-all hover:bg-surface"
				onClick={() => {
					updateModals({ settings: { isOpen: true } });
				}}
			>
				<IconMingcuteSettings5Fill className="h-6 w-6 text-white/80 transition-all hover:rotate-60" />
			</button>
			{/* <div className="absolute top-10 left-10 flex flex-col items-center justify-center gap-y-5 rounded-xl bg-surface p-5 shadow-xl">
				<HuginnIcon overrideTheme="text" className="hover:-rotate-12 size-20 text-primary-500 transition-transform hover:scale-105 active:rotate-6" />
			</div> */}
		</div>
	);
}
