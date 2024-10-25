import { createFileRoute } from "@tanstack/react-router";

type Search = {
	email: string;
	username: string;
	origin: "desktop" | "browser" | (string & {});
};

export const Route = createFileRoute("/redirect")({
	validateSearch: (search: Record<string, string>): Search => {
		return { email: search.email, origin: search.origin, username: search.username };
	},
	component: Redirect,
});

function Redirect() {
	// const appWindow = useWindow();
	const search = Route.useSearch();
	const [render, setRender] = useState(false);
	useEffect(() => {
		if (search.origin === "desktop") {
			setRender(true);
			const url = new URL("huginn://oauth-callback");
			url.searchParams.set("email", search.email);
			url.searchParams.set("username", search.username);
			window.open(url.toString(), "_self");
		}
	}, []);

	return (
		render && (
			<div className="flex h-full w-full bg-background">
				<div className="mt-20 flex w-full items-center justify-center">
					<div className="flex h-max flex-col items-center justify-center gap-y-5">
						<IconFa6SolidCrow className="size-20 animate-pulse text-text drop-shadow-[0px_0px_100px_rgb(var(--color-text))]" />
						<div className="font-bold text-2xl text-text">You are being redirected...</div>
					</div>
				</div>
			</div>
		)
	);
}
