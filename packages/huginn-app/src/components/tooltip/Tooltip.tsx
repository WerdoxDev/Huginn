import type { TooltipOptions } from "@/types";
import { useMergeRefs } from "@floating-ui/react";
import { Portal, Transition } from "@headlessui/react";
import { type HTMLProps, type ReactNode, type RefObject, cloneElement, isValidElement } from "react";

export default function Tooltip({ children, ...options }: { children: ReactNode } & TooltipOptions) {
	// This can accept any props as options, e.g. `placement`,
	// or other positioning options.
	const tooltip = useTooltip(options);
	return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
}

function Trigger(props: HTMLProps<HTMLButtonElement> & { asChild?: boolean }) {
	const context = useTooltipContext();
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const childrenRef = (props.children as any).ref;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const childrenProps = (props.children as any).props;
	const ref = useMergeRefs([context.refs.setReference, props.ref, childrenRef]);

	// `asChild` allows the user to pass any element as the anchor
	if (props.asChild && isValidElement(props.children)) {
		return cloneElement(
			props.children,
			context.getReferenceProps({
				ref,
				...props,
				...childrenProps,
				"data-state": context.open ? "open" : "closed",
			}),
		);
	}

	return (
		<button
			ref={ref}
			// The user can style the trigger based on the state
			data-state={context.open ? "open" : "closed"}
			{...context.getReferenceProps(props)}
		>
			{props.children}
		</button>
	);
}

function Content(props: HTMLProps<HTMLDivElement>) {
	const context = useTooltipContext();
	const ref = useMergeRefs([context.refs.setFloating, props.ref]);

	const staticSide = useMemo(
		() =>
			({
				top: "bottom",
				right: "left",
				bottom: "top",
				left: "right",
			})[context.placement.split("-")[0]] ?? "",
		[context.placement],
	);

	return (
		<Transition
			show={context.open}
			enter="transition-opacity duration-100"
			enterFrom="opacity-0"
			enterTo="opacity-100"
			leave="transition-opacity duration-100"
			leaveFrom="opacity-100"
			leaveTo="opacity-0"
		>
			<Portal>
				<div
					className="z-10 rounded-md bg-zinc-900 px-2.5 py-1.5 text-base text-white/80 shadow-lg"
					ref={ref}
					style={{
						...context.floatingStyles,
						...props.style,
					}}
					{...context.getFloatingProps(props)}
				>
					{context.getFloatingProps(props).children as ReactNode}
					<div
						style={{ left: context.middlewareData.arrow?.x, top: context.middlewareData.arrow?.y, [staticSide]: "-5px" }}
						ref={context.arrowRef}
						className="-z-10 absolute h-2.5 w-2.5 rotate-45 bg-zinc-900"
					/>
				</div>
			</Portal>
		</Transition>
	);
}

Tooltip.Trigger = Trigger;
Tooltip.Content = Content;
