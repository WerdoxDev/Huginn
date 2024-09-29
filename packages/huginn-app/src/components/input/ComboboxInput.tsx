import type { HuginnInputProps } from "@/types";
import { type ReactNode, createContext, useContext } from "react";
import HuginnInput from "./HuginnInput";

const ComboboxContext = createContext<{ selection: unknown[]; toggleSelection: (value: unknown) => void } | undefined>(undefined);

export function ComboboxInput<Value extends unknown[]>(
	props: HuginnInputProps & {
		selection: Value;
		onSelectionChange: (value: Value) => void;
		beforeInput?: ReactNode;
	},
) {
	function toggleSelection(value: unknown) {
		let newSelectedUsers = [...props.selection] as Value;

		if (newSelectedUsers.includes(value)) {
			newSelectedUsers = newSelectedUsers.filter((x) => x !== value) as Value;
		} else {
			newSelectedUsers.push(value);
		}

		props.onSelectionChange(newSelectedUsers);
	}

	// return props.children({ value: "123" });

	return (
		<ComboboxContext.Provider value={{ selection: props.selection, toggleSelection: toggleSelection }}>
			<HuginnInput {...props} placeholder="Search a friend">
				{props.children}
			</HuginnInput>
		</ComboboxContext.Provider>
	);
}

function SelectionDisplay(props: { children: ((props: { toggleSelection(value: unknown): void }) => ReactNode) | ReactNode }) {
	const comboboxContext = useContext(ComboboxContext);

	return (
		comboboxContext?.selection &&
		comboboxContext.selection.length > 0 &&
		(typeof props.children === "function" ? props.children({ toggleSelection: comboboxContext.toggleSelection }) : props.children)
	);
}

function OptionWrapper(props: { children?: ReactNode }) {
	return <div className="bg-secondary scroll-alternative2 mt-2 h-40 overflow-y-scroll rounded-md p-2">{props.children}</div>;
}

function Item(props: { value: unknown; children?: ReactNode }) {
	const comboboxContext = useContext(ComboboxContext);
	const inputContext = useContext(HuginnInput.InputContext);
	return (
		<div
			className="hover:bg-background -mr-2 flex select-none items-center gap-x-2 rounded-sm px-2 py-1 outline-none"
			onClick={() => {
				comboboxContext?.toggleSelection(props.value);
				inputContext.inputRef?.current?.focus();
			}}
		>
			{props.children}
		</div>
	);
}

ComboboxInput.SelectionDisplay = SelectionDisplay;
ComboboxInput.OptionWrapper = OptionWrapper;
ComboboxInput.Option = Item;