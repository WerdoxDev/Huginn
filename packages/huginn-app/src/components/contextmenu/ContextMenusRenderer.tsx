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
            <ContextMenu renderChildren={<ChannelsContextMenu />} onClose={dm_channel_close} contextMenu={dm_channel_context} />
            <ContextMenu
               renderChildren={<ChannelRecipientContextMenu />}
               onClose={dm_channel_recipient_close}
               contextMenu={dm_channel_recipient_context}
            />

            <ContextMenu renderChildren={<RelationshipContextMenu />} onClose={relationship_close} contextMenu={relationship_context} />

            <ContextMenu renderChildren={<RelationshipMoreContextMenu />} onClose={relationship_more_close} contextMenu={relationship_more_context} />

            <ContextMenu renderChildren={<VoiceElementContextMenu />} onClose={voice_user_close} contextMenu={{ ...voice_element_context, parent }} />

            <ContextMenu renderChildren={<MessageContextMenu />} onClose={message_close} contextMenu={{ ...message_context, parent }} />
         </>
      )
   );
}
