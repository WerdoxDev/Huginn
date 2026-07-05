import { MessageContext } from "@contexts/MessageProvider";
import { useIsInView } from "@hooks/useIsInView";
import { MessageType } from "@huginn/shared";
import { useContext, useEffect } from "react";

import ActionMessage from "./ActionMessage";
import DefaultMessage from "./DefaultMessage";

function MessageRenderer() {
   const context = useContext(MessageContext);
   const isInView = useIsInView(context.ref);

   useEffect(() => {
      if (!context.message.isPreview) {
         context.onVisibilityChanged?.((context.options?.idPrefix ?? "") + context.message.id, isInView);
      }
   }, [isInView, context.message.isPreview]);

   return (
      <li className="group relative shrink-0 select-text" ref={context.ref} id={(context.options?.idPrefix ?? "") + context.message.id}>
         {(context.message.isPreview || [MessageType.DEFAULT, MessageType.REPLY].includes(context.message.type)) && <DefaultMessage />}
         {!context.message.isPreview &&
            [
               MessageType.RECIPIENT_ADD,
               MessageType.RECIPIENT_REMOVE,
               MessageType.CHANNEL_NAME_CHANGED,
               MessageType.CHANNEL_ICON_CHANGED,
               MessageType.CHANNEL_OWNER_CHANGED,
               MessageType.CHANNEL_PINNED_MESSAGE,
               MessageType.CALL,
            ].includes(context.message.type) && <ActionMessage />}
      </li>
   );
}

export default MessageRenderer;
