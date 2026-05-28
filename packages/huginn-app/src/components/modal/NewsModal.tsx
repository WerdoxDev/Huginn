import ModalCloseButton from "@components/button/CloseButton";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import LoadingIcon from "@components/LoadingIcon";
import { getChangelogOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useQuery } from "@tanstack/react-query";
import markdownit from "markdown-it";
import moment from "moment";
import { useMemo } from "react";

import HuginnDialogPanel from "./HuginnDialogPanel";

export default function NewsModal() {
   const huginnWindow = useHuginnWindow();
   const client = useClient();
   const { updateModals, news: modal } = useModals();
   const { data, isLoading } = useQuery(getChangelogOptions(client!, huginnWindow.version, modal.lastVersion));

   const changelogs = useMemo(() => {
      console.log("Changelog data:", data);
      if (!data || data.length === 0) return;
      const md = new markdownit("default");
      return data.reduce(
         (acc, item) => {
            acc[item.version] = { html: md.render(item.content), date: item.date, title: item.title };
            return acc;
         },
         {} as Record<string, { html: string; date: string; title: string }>,
      );
   }, [data]);

   function close() {
      updateModals({ news: { isOpen: false } });
   }

   return (
      <HuginnDialogPanel className="w-xl">
         <ModalCloseButton onClick={close} />
         <div className="flex flex-col py-5">
            <HuginnDialogTitle title="Huginn News" className="px-5" />
            <div className="bg-surface-alt mx-2 mt-5 h-0.5" />
            {isLoading ? (
               <div className="flex h-40 items-center justify-center">
                  <LoadingIcon className="size-10" />
               </div>
            ) : changelogs ? (
               <div className="scroll-surface-deep flex h-full max-h-[70vh] flex-col gap-y-5 overflow-y-scroll pt-5 pr-2 pl-5">
                  {Object.entries(changelogs).map(([version, { html, date, title }]) => (
                     <div key={version} className="bg-surface-alt flex flex-col gap-y-2 rounded-lg p-3">
                        <div className="flex flex-col gap-y-2">
                           <div className="flex">
                              <div className="text-text border-primary-500 font-ubuntu w-max rounded-md border px-2">{version}</div>
                              <div className="text-text/80 ml-auto text-sm">{moment(date).format("MMMM Do YYYY")}</div>
                           </div>
                           <div className="text-primary-500 text-xl font-bold">{title}</div>
                        </div>
                        <div className="news-markdown flex flex-col gap-y-1" dangerouslySetInnerHTML={{ __html: html }} />
                     </div>
                  ))}
               </div>
            ) : (
               <div className="text-text/80 flex h-40 items-center justify-center text-lg">No news available :(</div>
            )}
         </div>
      </HuginnDialogPanel>
   );
}
