import type { APIRelease } from "@huginnjs/shared";

import { HuginnButton, HuginnMenu } from "@huginn/frontend-shared";
import { renderHtml } from "@tanstack/markdown";
import clsx from "clsx";
import { useEffect, useState } from "react";

type VersionCardProps = APIRelease & { latest?: boolean };

export default function VersionCard({
   description,
   latest,
   windowsDownloadUrl: windowsSetupUrl,
   macosDownloadUrl: macosSetupUrl,
   linuxDownloadUrl: linuxSetupUrl,
   androidDownloadUrl: androidSetupUrl,
}: VersionCardProps) {
   const [isVisible, setIsVisible] = useState(false);
   const [html, setHtml] = useState<string | null>(null);

   useEffect(() => {
      const frame = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(frame);
   }, []);

   useEffect(() => {
      if (!description) return;

      const html = renderHtml(description);
      setHtml(html);
   }, [description]);

   return (
      <div
         className={clsx(
            "group bg-surface-alt ease w-full rounded-lg border-2 p-4 shadow-md transition-all duration-250 hover:shadow-lg lg:max-w-md",
            latest ? "border-positive-500" : "border-caution-500",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
         )}
      >
         {!description ? (
            <div className="text-text/50 mt-3 italic">This release has no description</div>
         ) : (
            <div
               className="prose prose-sm prose-invert text-text prose-headings:text-text prose-a:text-primary-500 prose- max-w-none"
               dangerouslySetInnerHTML={{ __html: html ?? "" }}
            />
         )}

         <div className="mt-3 flex items-end justify-between">
            <div className="flex shrink-0 items-center justify-center gap-x-2">
               <IconMingcuteWindowsFill className={clsx("$ size-6", windowsSetupUrl ? "text-white" : "text-white/50")} />
               <IconMingcuteLinuxFill className={clsx("size-6", linuxSetupUrl ? "text-white" : "text-white/50")} />
               <IconMingcuteAndroidFill className={clsx("size-6", androidSetupUrl ? "text-white" : "text-white/50")} />
               <IconMingcuteAppleFill className={clsx("size-6", macosSetupUrl ? "text-white" : "text-white/50")} />
            </div>
            <HuginnMenu>
               {({ open }) => (
                  <>
                     {/*<HuginnMenu.Trigger className="border-positive-500 bg-surface hover:border-positive-500 hover:bg-surface ml-auto flex w-40 items-center justify-center gap-x-2 rounded-md border py-2 text-white transition-all outline-none">
                        <IconMingcuteDownload3Fill className="size-5" />
                        <span>Download</span>
                        <IconMingcuteDownFill className={`size-5 transition-all ${open ? "-scale-100" : ""}`} />
                     </HuginnMenu.Trigger>*/}
                     <HuginnMenu.Trigger asChild>
                        <HuginnButton color="positive" className="flex w-40 items-center justify-center gap-x-2 py-2">
                           <IconMingcuteDownload3Fill className="size-5" />
                           <span>Download</span>
                           <IconMingcuteDownFill className={`size-5 transition-all ${open ? "-scale-100" : ""}`} />
                        </HuginnButton>
                     </HuginnMenu.Trigger>
                     <HuginnMenu.Content side="bottom" align="end" sideOffset={8} className="bg-surface-deep w-40 gap-y-1">
                        {[
                           { icon: IconMingcuteWindowsFill, text: "Windows", url: windowsSetupUrl },
                           { icon: IconMingcuteLinuxFill, text: "Linux", url: linuxSetupUrl },
                           { icon: IconMingcuteAppleFill, text: "MacOS", url: macosSetupUrl },
                           { icon: IconMingcuteAndroidFill, text: "Android", url: androidSetupUrl },
                        ].map(({ icon: PlatformIcon, text, url }) => (
                           <HuginnMenu.Item key={text} disabled={!url} onClick={() => url && window.location.assign(url)} className="justify-start gap-x-2">
                              <PlatformIcon className="size-6" />
                              <span>{text}</span>
                           </HuginnMenu.Item>
                        ))}
                     </HuginnMenu.Content>
                  </>
               )}
            </HuginnMenu>
         </div>
      </div>
   );
}
