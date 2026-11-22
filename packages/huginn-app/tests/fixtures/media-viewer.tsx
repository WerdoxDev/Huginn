import type { ComponentProps } from "react";

import AttachmentElement from "@components/editor/AttachmentElement";
import ModalsRenderer from "@components/modal/ModalsRenderer";
import { MessageContext } from "@contexts/MessageProvider";
import { clientStore } from "@stores/clientStore";
import { ContextMenuProvider } from "@stores/contextMenuStore";
import { initStorageStoreEarly, storageStore } from "@stores/storageStore";
import { windowStore } from "@stores/windowStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";

import "../../src/index.css";

await initStorageStoreEarly();
await storageStore.getState().updateSettings({ mediaVolume: 37 });
windowStore.setState({ focused: true });
clientStore.setState({ urls: { cdn: location.origin } as NonNullable<ReturnType<typeof clientStore.getState>["urls"]> });

createRoot(document.getElementById("root")!).render(
   <QueryClientProvider client={new QueryClient()}>
      <ContextMenuProvider>
         <main className="p-10">
            <MessageContext.Provider
               value={
                  { message: { id: "message", channelId: "channel", isPreview: true }, options: { disableContextMenu: true } } as ComponentProps<
                     typeof MessageContext.Provider
                  >["value"]
               }
            >
               <AttachmentElement
                  id="video"
                  url={new URL("./video.webm", import.meta.url).href}
                  filename="video.webm"
                  size={1000}
                  width={320}
                  height={180}
                  contentType="video/webm"
               />
            </MessageContext.Provider>
         </main>
         <ModalsRenderer />
      </ContextMenuProvider>
   </QueryClientProvider>,
);
