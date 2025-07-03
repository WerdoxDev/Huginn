import { DialogPanel } from "@headlessui/react";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import markdownit from "markdown-it";
import moment from "moment";
import { useMemo } from "react";
import news from "@/assets/news/news.md?raw";

export default function NewsModal() {
	const { news: modal, updateModals } = useModals();
	const huginnWindow = useHuginnWindow();
	const html = useMemo(() => {
		const md = new markdownit("default");
		return md.render(news);
	}, []);

	return (
		<DialogPanel
			transition
			className="relative w-full max-w-lg rounded-xl border-2 border-primary/50 bg-background transition-[opacity_transform] duration-200 data-closed:scale-90"
		>
			<div className="flex flex-col">
				<div className="p-5 pb-0">
					<div className="font-semibold text-text text-xl">
						What's new in <span className="font-bold text-accent">Huginn {huginnWindow.version}</span>
					</div>
					<div className="text-text/80">{moment(localStorage.getItem("release-date")).format("MMMM Do YYYY")}</div>
				</div>
				<div className="mt-5 mb-4 h-0.5 w-full bg-primary/50" />
				<div
					className="news-markdown flex max-h-120 flex-col gap-y-2 overflow-y-auto p-5 pt-0 pb-5"
					//  biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			</div>
		</DialogPanel>
	);
}
