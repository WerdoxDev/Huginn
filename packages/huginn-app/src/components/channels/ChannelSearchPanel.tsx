import { HuginnButton, HuginnInput } from "@huginn/frontend-shared";
import { useEffect, useRef } from "react";

import type { AppDirectChannel } from "@/types";

export default function ChannelSearchPanel(props: { channel: AppDirectChannel; onClose: () => void }) {
   const inputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      // The input can mount while the panel is still sliding in from offscreen.
      inputRef.current?.focus({ preventScroll: true });
   }, []);

   return (
      <div className="text-text flex h-full min-h-0 flex-col">
         <div className="scroll-super-thin flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
            <HuginnInput ref={inputRef} placeholder="Search messages...">
               <HuginnInput.Label>Search</HuginnInput.Label>
               <HuginnInput.Wrapper className="bg-surface-deep">
                  <div className="flex items-center justify-center pl-2">
                     <IconMingcuteSearch2Fill className="size-5 shrink-0" />
                  </div>
                  <HuginnInput.Input autoComplete="off" className="min-w-0 text-sm" />
               </HuginnInput.Wrapper>
            </HuginnInput>
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
               {/*<div className="bg-surface text-text/40 mb-4 flex size-14 items-center justify-center rounded-full">
                  <IconMingcuteSearch2Fill className="size-7" />
               </div>*/}
               {/*<div className="mb-2 text-sm font-medium">Find a message</div>*/}
               {/*<p id="channel-search-hint" className="text-text/50 max-w-64 text-sm leading-relaxed">
                  Search this conversation by keyword, sender, or date.
               </p>*/}
               {/*<p className="text-text/40 mt-4 text-xs">Message search is coming soon.</p>*/}
            </div>
         </div>
      </div>
   );
}
