import type { TooltipOptions } from "@/types";
import { TooltipContext, useTooltip, useTooltipContext } from "@contexts/tooltipContext";
import { useMergeRefs } from "@floating-ui/react";
import { Portal, Transition } from "@headlessui/react";
import clsx from "clsx";
import { type HTMLProps, type ReactNode, type RefObject, cloneElement, isValidElement, useMemo } from "react";

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
	context.placement;

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
					className="absolute z-10 rounded-md border border-background bg-zinc-900 px-2.5 py-1.5 text-base text-white/80 shadow-lg"
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
						className={clsx(
							"absolute h-2.5 w-2.5 border-background border-t border-l bg-zinc-900",
							context.placement.includes("bottom") && "rotate-45",
							context.placement.includes("top") && "rotate-[-135deg]",
							context.placement.includes("left") && "-rotate-[225deg]",
							context.placement.includes("right") && "-rotate-45",
						)}
					/>
				</div>
			</Portal>
		</Transition>
	);
}

Tooltip.Trigger = Trigger;
Tooltip.Content = Content;
