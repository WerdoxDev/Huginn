import { useQuery } from "@tanstack/react-query";
import { getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { open } from "@tauri-apps/plugin-shell";

export default function SettingsAboutTab() {
	const huginnWindow = useHuginnWindow();
	const { data: appData } = useQuery({
		queryKey: ["app-data"],
		queryFn: async () => {
			const version = huginnWindow.environment === "desktop" ? await getVersion() : __APP_VERSION__;
			const tauriVersion = huginnWindow.environment === "desktop" && (await getTauriVersion());

			return { version, tauriVersion };
		},
	});
	return (
		<div className="mt-5 w-full text-text">
			<div className="mb-5 flex items-center gap-x-3">
				<HuginnIcon outlined className="h-16 w-16" />
				<span className="font-bold text-2xl">Huginn</span>
			</div>
			<div>
				<span>A simple, yet playful chat application to make chatting,</span> <span className="text-text/70">well... </span>
				<span className="font-bold">FUN!</span> Inspired by <span className="text-success/90">Norse mythology</span>, it captures the spirit of{" "}
				<span className="font-bold text-accent">Huginn</span>, one of <span className="text-error">Odin's</span> ravens, symbolizing thought and
				<span>memory.</span>
			</div>
			<div className="mt-10">
				<div>
					<span className="text-text/70">Author: </span>
					<span>Matin Tat (Werdox)</span>
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
				{huginnWindow.environment === "desktop" && (
					<div>
						<span className="text-text/70">Tauri version: </span>
						{appData?.tauriVersion}
					</div>
				)}
			</div>
		</div>
	);
}
