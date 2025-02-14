import type { ReactNode } from "react";
import HuginnButton from "./HuginnButton";

export default function QuickActionButton(props: { children?: ReactNode; onClick?: () => void }) {
	return (
		<HuginnButton className="rounded-lg border-2 border-background p-2 px-4 text-text transition-shadow hover:shadow-xl" onClick={props.onClick}>
			{props.children}
		</HuginnButton>
	);
}
