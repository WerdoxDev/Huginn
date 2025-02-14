import type { HuginnInputProps, InputStatus } from "@/types";
import { useInputBorder } from "@hooks/useInputBorder";
import { WorkerID, snowflake } from "@huginn/shared";
import clsx from "clsx";
import {
	type ChangeEvent,
	type HTMLInputTypeAttribute,
	type ReactNode,
	type RefObject,
	createContext,
	useContext,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

const InputContext = createContext<{
	id: string;
	status: InputStatus;
	value?: string;
	required?: boolean;
	placeholder?: string;
	type?: HTMLInputTypeAttribute;
	inputRef?: RefObject<HTMLInputElement | null>;
	disabled?: boolean;
	onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
	onFocusChange?: (focused: boolean) => void;
}>({
	id: "",
	status: { code: "none", text: "" },
});

export default function HuginnInput(props: HuginnInputProps) {
	const [id, _setId] = useState(() => snowflake.generateString(WorkerID.APP));
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<InputContext.Provider
			value={{
				id: id,
				value: props.value,
				required: props.required,
				status: props.status,
				placeholder: props.placeholder,
				type: props.type,
				inputRef: inputRef,
				disabled: props.disabled,
				onChange: props.onChange,
				onFocusChange: props.onFocusChanged,
			}}
		>
			<div className={clsx(!props.headless && "flex flex-col", props.className)}>{props.children}</div>
		</InputContext.Provider>
	);
}

function Input(props: { headless?: boolean; className?: string; lowercase?: boolean }) {
	const inputContext = useContext(InputContext);
	const [cursor, setCursor] = useState<number | null>(null);

	function onChange(e: ChangeEvent<HTMLInputElement>) {
		setCursor(e.target.selectionStart);
		inputContext.onChange?.(e);
	}
	useLayoutEffect(() => {
		inputContext.inputRef?.current?.setSelectionRange(cursor, cursor);
	}, [inputContext.value, cursor]);

	return (
		<input
			spellCheck={false}
			id={inputContext.id}
			value={inputContext.value}
			ref={inputContext.inputRef}
			className={clsx(
				!props.headless && "w-full bg-transparent p-2 text-white placeholder-text/60 outline-none disabled:cursor-not-allowed",
				props.className,
			)}
			disabled={inputContext.disabled}
			type={inputContext.type ?? "text"}
			autoComplete="new-password"
			placeholder={inputContext.placeholder}
			onChange={onChange}
			onFocus={() => inputContext.onFocusChange?.(true)}
			onBlur={() => inputContext.onFocusChange?.(false)}
		/>
	);
}

function Wrapper(props: {
	className?: string;
	headless?: boolean;
	border?: "left" | "right" | "top" | "bottom";
	children?: ReactNode;
}) {
	const inputContext = useContext(InputContext);
	const { hasBorder, borderColor } = useInputBorder(inputContext.status);

	return (
		<div
			className={clsx(
				props.className,
				!props.headless && "flex w-full items-center rounded-md bg-secondary",
				hasBorder &&
					((props.border === "top" && "border-t-4") ||
						(props.border === "bottom" && "border-b-4") ||
						(props.border === "left" && "border-l-4") ||
						(props.border === "right" && "border-r-4")),
				hasBorder && props.border && borderColor,
			)}
		>
			{props.children}
		</div>
	);
}

function Label(props: { children?: ReactNode; headless?: boolean; className?: string; text: string; hideAdditional?: boolean }) {
	const inputContext = useContext(InputContext);

	return (
		<label
			htmlFor={inputContext.id}
			className={clsx(
				!props.headless && "select-none font-medium text-xs uppercase opacity-90",
				inputContext.status.code === "none" ? "text-text" : "text-error",
				props.className,
			)}
		>
			{props.text}
			{!props.hideAdditional &&
				(inputContext.status.text ? (
					<span className={clsx("text-error", inputContext.status.text && "font-normal normal-case italic")}>
						<span className="px-0.5">-</span>
						{inputContext.status.text}
					</span>
				) : (
					inputContext.required && <span className="pl-0.5 text-error">*</span>
				))}
		</label>
	);
}

HuginnInput.Label = Label;
HuginnInput.Wrapper = Wrapper;
HuginnInput.Input = Input;
HuginnInput.InputContext = InputContext;
