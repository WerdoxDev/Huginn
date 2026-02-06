import { useHuginnWindow } from "@stores/windowStore";
import markdownit from "markdown-it";
import moment from "moment";
import { useMemo } from "react";
import news from "@/assets/news/news.md?raw";
import HuginnDialogPanel from "./HuginnDialogPanel";

export default function NewsModal() {
   const huginnWindow = useHuginnWindow();
   const html = useMemo(() => {
      const md = new markdownit("default");
      return md.render(news);
   }, []);

   return (
      <HuginnDialogPanel className="max-w-lg">
         <div className="flex flex-col">
            <div className="p-5 pb-0">
               <div className="text-text text-xl font-semibold">
                  What's new in <span className="text-primary-500 font-bold">Huginn {huginnWindow.version}</span>
               </div>
               <div className="text-text/80">{moment(localStorage.getItem("release-date")).format("MMMM Do YYYY")}</div>
            </div>
            <div className="bg-primary-800 mt-5 mb-4 h-0.5 w-full" />
            <div className="news-markdown flex max-h-120 flex-col gap-y-2 overflow-y-auto p-5 pt-0 pb-5" dangerouslySetInnerHTML={{ __html: html }} />
         </div>
      </HuginnDialogPanel>
   );
}
