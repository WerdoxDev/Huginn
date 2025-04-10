import type { StatusCode } from "@/types";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export default function AnimatedMessage(props: { className?: string; status: StatusCode; visible: boolean; text: string }) {
	const text = useRef<HTMLDivElement>(null);
	const [scrollHeight, setScrollHeight] = useState<number | undefined>(text.current?.scrollHeight);

	const [textColor, setTextColor] = useState<string>();

	const maxHeight = `${scrollHeight}px`;

	useEffect(() => {
		if (props.status === "default") setTextColor("text-text/80");
		else if (props.status === "error") setTextColor("text-error");
		else if (props.status === "success") setTextColor("text-success");
	}, [props.status]);

	useEffect(() => {
		setScrollHeight(text.current?.scrollHeight);
	}, [props.text]);

	return (
		<div className="select-none transition-[height]" style={{ height: props.visible ? maxHeight : "0px" }}>
			<div ref={text} className={clsx("text-sm transition-opacity", props.className, props.visible ? "opacity-90" : "opacity-0", textColor)}>
				{props.text}
			</div>
		</div>
	);
}
