import HuginnButton from "@components/button/HuginnButton.tsx";
import type { ReactNode } from "@tanstack/react-router";

export function QuickActionButton(props: { children?: ReactNode; onClick?: () => void }) {
	return (
		<HuginnButton className="border-background text-text rounded-lg border-2 p-2 px-4 transition-shadow hover:shadow-xl" onClick={props.onClick}>
			{props.children}
		</HuginnButton>
	);
}
