import { DialogPanel } from "@headlessui/react";
import { useHuginnWindow } from "@stores/windowStore";
import markdownit from "markdown-it";
import moment from "moment";
import { useMemo } from "react";
import news from "@/assets/news/news.md?raw";

export default function NewsModal() {
   const huginnWindow = useHuginnWindow();
   const html = useMemo(() => {
      const md = new markdownit("default");
      return md.render(news);
   }, []);

   return (
      <DialogPanel
         transition
         className="border-primary-800 bg-surface data-closed:scale-90 relative w-full max-w-lg rounded-xl border-2 transition-[opacity_transform] duration-200"
      >
         <div className="flex flex-col">
            <div className="p-5 pb-0">
               <div className="text-text text-xl font-semibold">
                  What's new in <span className="text-primary-500 font-bold">Huginn {huginnWindow.version}</span>
               </div>
               <div className="text-text/80">{moment(localStorage.getItem("release-date")).format("MMMM Do YYYY")}</div>
            </div>
            <div className="bg-primary-800 mb-4 mt-5 h-0.5 w-full" />
            <div className="news-markdown max-h-120 flex flex-col gap-y-2 overflow-y-auto p-5 pb-5 pt-0" dangerouslySetInnerHTML={{ __html: html }} />
         </div>
      </DialogPanel>
   );
}
