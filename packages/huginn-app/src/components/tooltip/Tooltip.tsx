import type { TooltipOptions } from "@/types";
import { useMergeRefs } from "@floating-ui/react";
import { Portal, Transition } from "@headlessui/react";
import type { ReactNode } from "@tanstack/react-router";
import { type HTMLProps, cloneElement, isValidElement } from "react";

export default function Tooltip({ children, ...options }: { children: ReactNode } & TooltipOptions) {
	// This can accept any props as options, e.g. `placement`,
	// or other positioning options.
	const tooltip = useTooltip(options);
	return <TooltipContext.Provider value={tooltip}>{children}</TooltipContext.Provider>;
}

const Trigger = forwardRef<HTMLButtonElement, HTMLProps<HTMLButtonElement> & { asChild?: boolean }>(function TooltipTrigger(
	{ children, asChild = false, ...props },
	propRef,
) {
	const context = useTooltipContext();
	const childrenRef = (children as ReactNode).ref;
	const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

	// `asChild` allows the user to pass any element as the anchor
	if (asChild && isValidElement(children)) {
		return cloneElement(
			children,
			context.getReferenceProps({
				ref,
				...props,
				...children.props,
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
			{children}
		</button>
	);
});

const Content = forwardRef<HTMLDivElement, HTMLProps<HTMLDivElement>>(function TooltipContent({ style, ...props }, propRef) {
	const context = useTooltipContext();
	const ref = useMergeRefs([context.refs.setFloating, propRef]);

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
						...style,
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
});

Tooltip.Trigger = Trigger;
Tooltip.Content = Content;
