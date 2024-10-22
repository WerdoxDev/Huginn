import clsx from "clsx";

export default function LoadingIcon(props: { className?: string }) {
	return <IconMingcuteLoading3Fill className={clsx("animate-spin text-text", props.className)} />;
}
