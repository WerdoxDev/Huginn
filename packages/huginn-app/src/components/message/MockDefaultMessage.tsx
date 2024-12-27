import clsx from "clsx";

export default function MockDefaultMessage(props: {
	separate?: boolean;
	text: string;
	roundedTop?: number;
	roundedBottom?: number;
	end?: boolean;
	self?: boolean;
	marginTop?: boolean;
}) {
	return (
		<div
			className={clsx(
				"flex flex-col items-start gap-y-2 p-2 hover:bg-secondary",
				props.separate && "rounded-t-lg pb-0",
				!props.separate && "mt-0.5 py-0",
				props.end && "rounded-b-lg",
				!props.self && "ml-2",
				props.marginTop && "mt-1.5",
			)}
		>
			{props.separate && (
				<div className="flex items-center gap-x-2 overflow-hidden">
					<UserAvatar userId="0" statusSize="0.5rem" size="1.75rem" />
					<div className="text-sm text-text">{props.self ? "You" : "ThorEnjoyer"}</div>
					<div className="text-text/50 text-xs">{props.self ? "27.12.2024 11:40" : "27.12.2024 11:41"}</div>
				</div>
			)}
			<div className="overflow-hidden font-light text-white">
				<div
					className={clsx(
						"px-2.5 py-1.5 font-normal text-white [overflow-wrap:anywhere]",
						props.separate && "rounded-t-xl",
						props.self ? "bg-primary" : "bg-background",
						props.end && "!rounded-b-xl",
					)}
					style={{ borderTopRightRadius: props.roundedTop, borderBottomRightRadius: props.roundedBottom }}
				>
					{props.text}
				</div>
			</div>
		</div>
	);
}
