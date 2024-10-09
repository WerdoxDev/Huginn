import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";

export default function DefaultError(props: ErrorComponentProps) {
	const router = useRouter();

	return (
		<div className="bg-secondary text-error flex h-full w-full flex-col items-center justify-center gap-y-1 text-xl">
			Ooops, There was a problem rendering this page!
			<span>{router.state.location.pathname}</span>
			<span>{props.info?.componentStack}</span>
		</div>
	);
}
