import ModalErrorComponent from "@components/ModalErrorComponent";
import { useContextMenu } from "@stores/contextMenuStore";
import { useThisUser } from "@stores/userStore";
import { lazy, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import ContextMenu from "./ContextMenu";

const VoiceElementContextMenu = lazy(() => import("./VoiceElementContextMenu"));
const ChannelsContextMenu = lazy(() => import("./ChannelsContextMenu"));
const ChannelRecipientContextMenu = lazy(() => import("./ChannelRecipientContextMenu"));
const RelationshipContextMenu = lazy(() => import("./RelationshipContextMenu"));
const RelationshipMoreContextMenu = lazy(() => import("./RelationshipMoreContextMenu"));
const MessageContextMenu = lazy(() => import("./MessageContextMenu"));

export default function ContextMenusRenderer() {
   const { user } = useThisUser();
   const [parent, setParent] = useState<HTMLElement | null>(null);

   const { context: dm_channel_context, close: dm_channel_close } = useContextMenu("dm_channel");
   const { context: dm_channel_recipient_context, close: dm_channel_recipient_close } = useContextMenu("dm_channel_recipient");
   const { context: relationship_context, close: relationship_close } = useContextMenu("relationship");
   const { context: relationship_more_context, close: relationship_more_close } = useContextMenu("relationship_more");
   const { context: voice_element_context, close: voice_user_close } = useContextMenu("voice_element");
   const { context: message_context, close: message_close } = useContextMenu("message");

   useEffect(() => {
      const controller = new AbortController();

      document.addEventListener(
         "fullscreenchange",
         (_e) => {
            setParent(document.fullscreenElement as HTMLElement | null);
         },
         { signal: controller.signal },
      );

      return () => {
         controller.abort();
      };
   }, []);

   return (
      <ErrorBoundary FallbackComponent={ModalErrorComponent}>
         {user && (
            <>
               <ContextMenu
                  renderChildren={<ChannelsContextMenu />}
                  close={dm_channel_close}
                  isOpen={dm_channel_context?.isOpen}
                  position={dm_channel_context?.position}
               />
               <ContextMenu
                  renderChildren={<ChannelRecipientContextMenu />}
                  close={dm_channel_recipient_close}
                  isOpen={dm_channel_recipient_context?.isOpen}
                  position={dm_channel_recipient_context?.position}
               />

               <ContextMenu
                  renderChildren={<RelationshipContextMenu />}
                  close={relationship_close}
                  isOpen={relationship_context?.isOpen}
                  position={relationship_context?.position}
               />

               <ContextMenu
                  renderChildren={<RelationshipMoreContextMenu />}
                  close={relationship_more_close}
                  isOpen={relationship_more_context?.isOpen}
                  position={relationship_more_context?.position}
               />

               <ContextMenu
                  renderChildren={<VoiceElementContextMenu />}
                  close={voice_user_close}
                  isOpen={voice_element_context?.isOpen}
                  position={voice_element_context?.position}
                  parent={parent}
               />

               <ContextMenu
                  renderChildren={<MessageContextMenu />}
                  close={message_close}
                  isOpen={message_context?.isOpen}
                  position={message_context?.position}
                  parent={parent}
               />
            </>
         )}
      </ErrorBoundary>
   );
}
