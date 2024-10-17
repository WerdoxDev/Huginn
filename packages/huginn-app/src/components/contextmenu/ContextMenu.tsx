import type { ContextMenuItemProps, ContextMenuProps } from "@/types.ts";
import {
	FloatingFocusManager,
	FloatingList,
	FloatingNode,
	FloatingPortal,
	FloatingTree,
	autoUpdate,
	flip,
	offset,
	safePolygon,
	shift,
	useDismiss,
	useFloating,
	useFloatingNodeId,
	useFloatingParentNodeId,
	useFloatingTree,
	useHover,
	useInteractions,
	useListItem,
	useListNavigation,
	useMergeRefs,
	useRole,
} from "@floating-ui/react";
import { clsx } from "@nick/clsx";

import { type HTMLProps, createContext, forwardRef, useContext, useEffect, useRef, useState } from "react";

const Context = createContext<{
	getItemProps: (userProps?: React.HTMLProps<HTMLElement>) => Record<string, unknown>;
	activeIndex: number | null;
	setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>;
	setHasFocusInside: React.Dispatch<React.SetStateAction<boolean>>;
	isOpen: boolean;
}>({
	getItemProps: () => ({}),
	activeIndex: null,
	setActiveIndex: () => {},
	setHasFocusInside: () => {},
	isOpen: false,
});

const Menu = forwardRef<HTMLButtonElement, ContextMenuProps & HTMLProps<HTMLButtonElement>>(({ children, label, ...props }, forwardedRef) => {
	const [isOpen, _setIsOpen] = useState(false);
	const [hasFocusInside, setHasFocusInside] = useState(false);
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	const elementsRef = useRef<(HTMLButtonElement | null)[]>([]);
	const labelsRef = useRef<(string | null)[]>([]);
	const parent = useContext(Context);

	const tree = useFloatingTree();
	const nodeId = useFloatingNodeId();
	const parentId = useFloatingParentNodeId();
	const item = useListItem();

	const isNested = parentId != null;

	const { floatingStyles, refs, context } = useFloating<HTMLButtonElement>({
		nodeId,
		open: isOpen,
		onOpenChange: setIsOpen,
		placement: isNested ? "right-start" : "bottom-start",
		middleware: [offset({ mainAxis: isNested ? 12 : 0, alignmentAxis: 0 }), flip(), shift({ padding: 10 })],
		whileElementsMounted: autoUpdate,
	});

	const hover = useHover(context, {
		enabled: isNested,
		delay: { open: 75 },
		handleClose: safePolygon({ blockPointerEvents: true }),
	});
	const role = useRole(context, { role: "menu" });
	const dismiss = useDismiss(context, { bubbles: true });
	const listNavigation = useListNavigation(context, {
		listRef: elementsRef,
		activeIndex,
		nested: isNested,
		onNavigate: setActiveIndex,
	});

	const mergedRefs = useMergeRefs([refs.setReference, item.ref, forwardedRef]);

	const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([hover, role, dismiss, listNavigation]);

	function setIsOpen(isOpen: boolean) {
		_setIsOpen(isOpen);
		if (!isOpen && props.close) props.close();
	}

	useEffect(() => {
		if (isNested) return;
		if (!props.isOpen) return;

		setIsOpen(true);

		refs.setPositionReference({
			getBoundingClientRect() {
				return {
					width: 0,
					height: 0,
					x: props.position?.[0] ?? 0,
					y: props.position?.[1] ?? 0,
					top: props.position?.[1] ?? 0,
					right: props.position?.[0] ?? 0,
					bottom: props.position?.[1] ?? 0,
					left: props.position?.[0] ?? 0,
				};
			},
		});
	}, [props.isOpen]);

	// Event emitter allows you to communicate across tree components.
	// This effect closes all menus when an item gets clicked anywhere
	// in the tree.
	useEffect(() => {
		if (!tree) return;

		function handleTreeClick() {
			setIsOpen(false);
		}

		function onSubMenuOpen(event: { nodeId: string; parentId: string }) {
			if (event.nodeId !== nodeId && event.parentId === parentId) {
				setIsOpen(false);
			}
		}

		tree.events.on("click", handleTreeClick);
		tree.events.on("menuopen", onSubMenuOpen);

		return () => {
			tree.events.off("click", handleTreeClick);
			tree.events.off("menuopen", onSubMenuOpen);
		};
	}, [tree, nodeId, parentId]);

	useEffect(() => {
		if (isOpen && tree) {
			tree.events.emit("menuopen", { parentId, nodeId });
		}
	}, [tree, isOpen, nodeId, parentId]);

	return (
		<FloatingNode id={nodeId}>
			{isNested && (
				<button
					ref={mergedRefs}
					tabIndex={parent.activeIndex === item.index ? 0 : -1}
					role="menuitem"
					data-open={isOpen ? "" : undefined}
					data-focus-inside={hasFocusInside ? "" : undefined}
					className="rounded-sm px-2 py-1 text-start text-sm text-white/90 outline-none focus:bg-primary"
					{...getReferenceProps(
						parent.getItemProps({
							...props,
							onFocus(event: React.FocusEvent<HTMLButtonElement>) {
								props.onFocus?.(event);
								setHasFocusInside(false);
								parent.setHasFocusInside(true);
							},
						}),
					)}
				>
					{label}
					<span aria-hidden style={{ marginLeft: 10, fontSize: 10 }}>
						▶
					</span>
				</button>
			)}
			<Context.Provider
				value={{
					activeIndex,
					setActiveIndex,
					getItemProps,
					setHasFocusInside,
					isOpen,
				}}
			>
				<FloatingList elementsRef={elementsRef} labelsRef={labelsRef}>
					{isOpen && (
						<FloatingPortal>
							<FloatingFocusManager context={context} modal={false} initialFocus={isNested ? -1 : 0} returnFocus={!isNested}>
								<div
									ref={refs.setFloating}
									className="flex min-w-28 flex-col gap-y-0.5 rounded-md bg-zinc-900 p-2 shadow-lg outline-none"
									style={floatingStyles}
									{...getFloatingProps()}
								>
									{children}
								</div>
							</FloatingFocusManager>
						</FloatingPortal>
					)}
				</FloatingList>
			</Context.Provider>
		</FloatingNode>
	);
});

const Item = forwardRef<HTMLButtonElement, ContextMenuItemProps & React.ButtonHTMLAttributes<HTMLButtonElement>>(
	({ label, disabled, ...props }, forwardedRef) => {
		const menu = useContext(Context);
		const item = useListItem({ label: disabled ? null : label });
		const tree = useFloatingTree();
		const isActive = item.index === menu.activeIndex;

		return (
			<button
				{...props}
				ref={useMergeRefs([item.ref, forwardedRef])}
				type="button"
				role="menuitem"
				className={clsx(
					"flex items-center justify-between gap-x-5 rounded-sm px-2 py-1 text-start text-sm text-white/90 outline-none focus:bg-primary",
					props.className,
				)}
				tabIndex={isActive ? 0 : -1}
				disabled={disabled}
				{...menu.getItemProps({
					onClick(event: React.MouseEvent<HTMLButtonElement>) {
						props.onClick?.(event);
						tree?.events.emit("click");
					},
					onFocus(event: React.FocusEvent<HTMLButtonElement>) {
						props.onFocus?.(event);
						menu.setHasFocusInside(true);
					},
				})}
			>
				{label}
				{props.children}
			</button>
		);
	},
);

export function ContextMenu(props: ContextMenuProps) {
	const parentId = useFloatingParentNodeId();

	if (parentId === null) {
		return (
			<FloatingTree>
				<Menu {...props} />
			</FloatingTree>
		);
	}

	return <Menu {...props} />;
}

function Divider() {
	return <div className="mx-1 my-0.5 h-0.5 bg-background" />;
}

ContextMenu.Item = Item;
ContextMenu.Divider = Divider;

// export function ContextMenu(){

// }

// <ContextMenu>
//    <ContextMenu.Button>
//       BUTTON
//    </ContextMenu.Button>
//
//    <ContextMenu.Menu>
//       <ContextMenu.Item>
//          ITEM 1
//       </ContextMenu.Item>
//
//       <ContextMenu.Menu>
//          <ContextMenu.Item>
//             ITEM 1
//          </ContextMenu.Item>
//       </ContextMenu.Menu>
//    </ContextMenu.Menu>
// </ContextMenu>
