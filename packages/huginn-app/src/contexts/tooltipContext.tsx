import type { TooltipOptions } from "@/types";
import { arrow, autoUpdate, flip, offset, shift, useDismiss, useFloating, useFocus, useHover, useInteractions, useRole } from "@floating-ui/react";
import React, { createContext, useRef } from "react";

type TooltipContextType = ReturnType<typeof useTooltip> | null;

export const TooltipContext = createContext<TooltipContextType>(null);

export function useTooltip({ initialOpen = false, placement = "top", open: controlledOpen, onOpenChange: setControlledOpen }: TooltipOptions = {}) {
	const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);

	const open = controlledOpen ?? uncontrolledOpen;
	const setOpen = setControlledOpen ?? setUncontrolledOpen;

	const arrowRef = useRef(null);

	const data = useFloating({
		placement,
		open,
		onOpenChange: setOpen,
		whileElementsMounted: autoUpdate,
		middleware: [
			offset(10),
			flip({
				crossAxis: placement.includes("-"),
				fallbackAxisSideDirection: "start",
				padding: 5,
			}),
			shift({ padding: 5 }),
			arrow({ element: arrowRef }),
		],
	});

	const context = data.context;

	const hover = useHover(context, {
		move: false,
		enabled: controlledOpen == null,
	});
	const focus = useFocus(context, {
		enabled: controlledOpen == null,
	});
	const dismiss = useDismiss(context);
	const role = useRole(context, { role: "tooltip" });

	const interactions = useInteractions([hover, focus, dismiss, role]);

	return { open, setOpen, ...interactions, ...data, arrowRef };
	// return React.useMemo(
	//    () => ({
	//       open,
	//       setOpen,
	//       ...interactions,
	//       ...data,
	//    }),
	//    [open, setOpen, interactions, data],
	// );
}

export function useTooltipContext() {
	const context = React.useContext(TooltipContext);

	if (context == null) {
		throw new Error("Tooltip components must be wrapped in <Tooltip />");
	}

	return context;
}
