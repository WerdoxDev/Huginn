import { Transition } from "@headlessui/react";
import { clsx } from "@nick/clsx";

export default function ChannelMessageLoadingIndicator(props: { isFetchingNextPage: boolean; isFetchingPreviousPage: boolean }) {
	return (
		<>
			<Transition show={props.isFetchingPreviousPage}>
				<div
					className={clsx(
						"data-[closed]:-translate-y-8 transition duration-75 data-[closed]:opacity-0",
						"pointer-events-none absolute inset-x-0 top-0 z-10 py-2 text-center text-text",
					)}
				>
					<span>Loading</span>
					<span className="loader__dot">.</span>
					<span className="loader__dot">.</span>
					<span className="loader__dot">.</span>
				</div>
			</Transition>
			<Transition show={props.isFetchingNextPage}>
				<div
					className={clsx(
						"transition duration-75 data-[closed]:translate-y-8 data-[closed]:opacity-0",
						"pointer-events-none absolute inset-x-0 bottom-0 z-10 py-2 text-center text-text",
					)}
				>
					<span>Loading</span>
					<span className="loader__dot">.</span>
					<span className="loader__dot">.</span>
					<span className="loader__dot">.</span>
				</div>
			</Transition>
		</>
	);
}
