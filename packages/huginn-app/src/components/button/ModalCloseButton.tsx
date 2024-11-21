import type { ReactNode } from "react";

export default function ModalCloseButton(props: { children?: ReactNode; onClick: () => void }) {
	return (
		<button
			className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-secondary hover:bg-tertiary"
			onClick={props.onClick}
			type="button"
		>
			<IconMingcuteCloseFill className="h-5 w-5 text-error" />
			{props.children}
		</button>
	);
}
