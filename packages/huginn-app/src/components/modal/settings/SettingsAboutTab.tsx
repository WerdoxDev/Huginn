import LinkButton from "@components/button/LinkButton";
import { useQuery } from "@tanstack/react-query";
import { getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { open } from "@tauri-apps/plugin-shell";

export default function SettingsAboutTab() {
	const { data: appData } = useQuery({
		queryKey: ["app-data"],
		queryFn: async () => {
			const version = await getVersion();
			const tauriVersion = await getTauriVersion();

			return { version, tauriVersion };
		},
	});
	return (
		<div className="text-text mt-5  w-full">
			<div className="mb-2 flex gap-x-2 text-2xl font-bold">
				<IconFa6SolidCrow className="text-accent" />
				Huginn
			</div>
			<div>
				A simple, yet playful chat application to make chatting, <span className="text-text/70">well... </span>
				<span className="font-bold">FUN!</span> Inspired by <span className="text-success/90">Norse mythology</span>, it captures the spirit of{" "}
				<span className="text-accent font-bold">Huginn</span>, one of <span className="text-error">Odin's</span> ravens, symbolizing thought and
				memory.
			</div>
			<div className="mt-10">
				<div>
					<span className="text-text/70">Author: </span>
					Matin Tat (Werdox)
				</div>
				<div>
					<span className="text-text/70">Github: </span>
					<LinkButton onClick={() => open("https://github.com/WerdoxDev")} className="text-base">
						https://github.com/WerdoxDev
					</LinkButton>
				</div>
				<div className="mt-2">
					<span className="text-text/70">App version: </span>
					{appData?.version}
				</div>
				<div>
					<span className="text-text/70">Tauri version: </span>
					{appData?.tauriVersion}
				</div>
			</div>
		</div>
	);
}
