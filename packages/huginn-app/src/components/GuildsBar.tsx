import GuildButton from "@components/button/GuildButton.tsx";
import HomeButton from "@components/button/HomeButton.tsx";

export default function GuildsBar() {
	return (
		<nav className="flex h-full w-[4.75rem] shrink-0 flex-col bg-background">
			<HomeButton />
			<div className="mx-4 h-0.5 bg-white/20" />
			<div className="flex flex-col items-center gap-3 py-3.5">
				<GuildButton />
				<GuildButton />
				<GuildButton />
			</div>
		</nav>
	);
}
