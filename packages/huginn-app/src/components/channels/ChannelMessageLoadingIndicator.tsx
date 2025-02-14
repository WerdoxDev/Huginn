import LoadingDot from "@components/LoadingDot";
import { Transition } from "@headlessui/react";
import clsx from "clsx";

export default function ChannelMessageLoadingIndicator(props: { isFetchingNextPage: boolean; isFetchingPreviousPage: boolean }) {
	return (
		<>
			<Transition show={props.isFetchingPreviousPage}>
				<div className="data-[closed]:-translate-y-8 pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center py-2 text-text transition duration-75 data-[closed]:opacity-0">
					<span>Loading</span>
					<LoadingDot loadingClassName="w-1 h-1" className="mt-1 ml-1 gap-x-0.5" />
				</div>
			</Transition>
			<Transition show={props.isFetchingNextPage}>
				<div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center py-2 text-text transition duration-75 data-[closed]:translate-y-8 data-[closed]:opacity-0">
					<span>Loading</span>
					<LoadingDot loadingClassName="w-1 h-1" className="mt-1 ml-1 gap-x-0.5" />
				</div>
			</Transition>
		</>
	);
}
