import { useContextMenu } from "@stores/contextMenuStore";
import { useThisUser } from "@stores/userStore";
import { useEffect, useState } from "react";

import ChannelRecipientContextMenu from "./ChannelRecipientContextMenu";
import ChannelsContextMenu from "./ChannelsContextMenu";
import ContextMenu from "./ContextMenu";
import MessageContextMenu from "./MessageContextMenu";
import RelationshipContextMenu from "./RelationshipContextMenu";
import RelationshipMoreContextMenu from "./RelationshipMoreContextMenu";
import VoiceElementContextMenu from "./VoiceElementContextMenu";

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
      user && (
         <>
            <ContextMenu
               renderChildren={<ChannelsContextMenu />}
               onClose={dm_channel_close}
               isOpen={dm_channel_context?.isOpen}
               position={dm_channel_context?.position}
            />
            <ContextMenu
               renderChildren={<ChannelRecipientContextMenu />}
               onClose={dm_channel_recipient_close}
               isOpen={dm_channel_recipient_context?.isOpen}
               position={dm_channel_recipient_context?.position}
            />

            <ContextMenu
               renderChildren={<RelationshipContextMenu />}
               onClose={relationship_close}
               isOpen={relationship_context?.isOpen}
               position={relationship_context?.position}
            />

            <ContextMenu
               renderChildren={<RelationshipMoreContextMenu />}
               onClose={relationship_more_close}
               isOpen={relationship_more_context?.isOpen}
               position={relationship_more_context?.position}
            />

            <ContextMenu
               renderChildren={<VoiceElementContextMenu />}
               onClose={voice_user_close}
               isOpen={voice_element_context?.isOpen}
               position={voice_element_context?.position}
               parent={parent}
            />

            <ContextMenu
               renderChildren={<MessageContextMenu />}
               onClose={message_close}
               isOpen={message_context?.isOpen}
               position={message_context?.position}
               parent={parent}
            />
         </>
      )
   );
}
