import type { HuginnInputProps } from "@/types";
import clsx from "clsx";
import { type HTMLInputTypeAttribute, createContext, useContext, useMemo, useState } from "react";
import HuginnInput from "./HuginnInput";

const PasswordContext = createContext({ toggleType: () => {}, hidden: true });

export default function PasswordInput(props: HuginnInputProps) {
	const [type, setType] = useState<HTMLInputTypeAttribute>(() => "password");

	const hidden = useMemo(() => type === "password", [type]);

	function toggleType() {
		setType(type === "password" ? "text" : "password");
	}

	return (
		<PasswordContext.Provider value={{ hidden, toggleType }}>
			<HuginnInput {...props} type={type}>
				{props.children}
			</HuginnInput>
		</PasswordContext.Provider>
	);
}

function ToggleButton(props: { className?: string }) {
	const context = useContext(PasswordContext);
	return (
		<button
			className={clsx(
				"flex h-full w-11 shrink-0 select-none items-center justify-center border-l-2 border-l-background text-sm text-text",
				props.className,
			)}
			type="button"
			onClick={context.toggleType}
		>
			{context.hidden ? <IconMingcuteEyeCloseFill className="h-6 w-6" /> : <IconMingcuteEye2Fill className="h-6 w-6" />}
		</button>
	);
}

PasswordInput.ToggleButton = ToggleButton;
