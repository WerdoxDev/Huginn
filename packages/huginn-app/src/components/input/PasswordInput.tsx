import type { HuginnInputProps } from "@/types.ts";
import HuginnInput from "@components/input/HuginnInput.tsx";
import { type HTMLInputTypeAttribute, createContext, useContext, useMemo, useState } from "react";

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

function ToggleButton() {
	const context = useContext(PasswordContext);
	return (
		<button
			className="flex h-full w-11 select-none items-center justify-center border-l-2 border-l-background text-sm text-text"
			type="button"
			onClick={context.toggleType}
		>
			{context.hidden ? <IconMdiShow className="h-6 w-6" /> : <IconMdiHide className="h-6 w-6" />}
		</button>
	);
}

PasswordInput.ToggleButton = ToggleButton;
