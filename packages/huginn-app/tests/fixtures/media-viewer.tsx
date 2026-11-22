// A message-to-viewer boundary with local media; no live instance or application mocks.
import "../../src/index.css";
import type { ComponentProps } from "react";

import AttachmentElement from "@components/editor/AttachmentElement";
import EmbedElement from "@components/editor/EmbedElement";
import BaseModal from "@components/modal/BaseModal";
import MagnifiedMediaModal from "@components/modal/MagnifiedMediaModal";
import { MessageContext } from "@contexts/MessageProvider";
import { useBackButtonManager } from "@hooks/useBackButtonManager";
import { ExpressionType } from "@huginnjs/shared";
import { clientStore } from "@stores/clientStore";
import { ContextMenuProvider } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import { initStorageStoreEarly, storageStore } from "@stores/storageStore";
import { windowStore } from "@stores/windowStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";

const videoUrl = new URL("./viewer.webm", import.meta.url).href;
const imageUrl = new URL("./viewer.png?preview=1", import.meta.url).href;
await initStorageStoreEarly();
await storageStore.getState().updateSettings({ mediaVolume: 37 });
windowStore.setState({ focused: true });
clientStore.setState({ urls: { cdn: new URL(videoUrl).origin } as NonNullable<ReturnType<typeof clientStore.getState>["urls"]> });
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const message = {
   message: { id: "message", channelId: "channel", isPreview: true },
   options: { disableContextMenu: true },
} as ComponentProps<typeof MessageContext.Provider>["value"];

function Fixture() {
   useBackButtonManager();
   const { magnifiedMedia, updateModals } = useModals();
   return (
      <QueryClientProvider client={queryClient}>
         <ContextMenuProvider>
            <MessageContext.Provider value={message}>
               <main className="flex flex-wrap gap-4 p-6">
                  <section aria-label="Video message">
                     <AttachmentElement
                        id="video"
                        url={videoUrl}
                        filename="movie.webm"
                        size={230000}
                        width={640}
                        height={360}
                        contentType="video/webm"
                     />
                  </section>
                  <section aria-label="Image message">
                     <AttachmentElement id="image" url={imageUrl} filename="image.png" size={1000} width={640} height={360} contentType="image/png" />
                  </section>
                  <section aria-label="Expression message">
                     <EmbedElement
                        embedType="gif"
                        media={{
                           id: "expression",
                           type: ExpressionType.UPLOADED,
                           url: videoUrl,
                           src: videoUrl,
                           contentType: "video/webm",
                           title: "Expression",
                           width: 640,
                           height: 360,
                        }}
                     />
                  </section>
               </main>
            </MessageContext.Provider>
            <BaseModal
               modal={magnifiedMedia}
               onClose={() => updateModals({ magnifiedMedia: { isOpen: false } })}
               renderChildren={<MagnifiedMediaModal />}
               headless
            />
         </ContextMenuProvider>
      </QueryClientProvider>
   );
}

createRoot(document.getElementById("root")!).render(<Fixture />);
