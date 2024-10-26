import { FieldCode } from "@huginn/shared";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

type Search = {
	token?: string;
	error?: string;
	origin: "desktop" | "browser" | (string & {});
};

export const Route = createFileRoute("/redirect")({
	validateSearch: (search: Record<string, string>): Search => {
		return { token: search.token, error: search.error, origin: search.origin };
	},
	component: Redirect,
});

function Redirect() {
	const search = Route.useSearch();
	const navigate = useNavigate();

	const link = useMemo(() => {
		if (!search.token) return "";
		const param = new URLSearchParams({ token: search.token });
		return `${search.origin === "desktop" ? "huginn://oauth-callback" : "/oauth-confirm"}?${param.toString()}`;
	}, []);

	const errorText = useMemo(
		() => (search.error === FieldCode.EMAIL_IN_USE ? "An account with that email address already exists!" : "Unknown Error"),
		[],
	);

	useEffect(() => {
		if (search.error) {
			return;
		}

		if (search.origin === "desktop") {
			window.open(link, "_self");
		} else {
			navigate({ to: link });
		}
	}, []);

	return (
		<div className="flex h-full w-full bg-secondary">
			<div className="flex w-full items-center justify-center">
				<div className="flex h-max flex-col items-center justify-center gap-y-5">
					{!search.error ? (
						<IconFa6SolidCrow className="size-20 animate-pulse text-text drop-shadow-[0px_0px_50px_rgb(var(--color-text))]" />
					) : (
						<IconMingcuteAlertLine className="size-20 animate-pulse text-error drop-shadow-[0px_0px_50px_rgb(var(--color-error))]" />
					)}
					<div className="text-center">
						<div className="font-bold text-2xl text-text">
							{search.error ? "Error!" : search.origin === "desktop" ? "Opening Huginn" : "You are being redirected..."}
						</div>
						<div className="mt-1 text-lg text-text/80">
							{search.error ? (
								errorText
							) : (
								<>
									If you are not redirected automatically, Please click{" "}
									<a href={link} className="text-accent underline">
										here
									</a>
								</>
							)}
						</div>
						{search.error && search.origin === "browser" && (
							<div className="mt-1">
								<a href="/" className="text-accent underline">
									Return to home
								</a>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
