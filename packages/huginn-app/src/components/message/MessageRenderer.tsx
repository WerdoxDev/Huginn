import { MessageContext } from "@contexts/MessageProvider";
import { useIsInView } from "@hooks/useIsInView";
import { MessageType } from "@huginn/shared";
import { useContext, useEffect } from "react";
import ActionMessage from "./ActionMessage";
import DefaultMessage from "./DefaultMessage";
import EditMessage from "./EditMessage";

function MessageRenderer() {
   const context = useContext(MessageContext);
   const isInView = useIsInView(context.ref);

   useEffect(() => {
      if (!context.message.isPreview) {
         context.onVisibilityChanged(context.message.id, isInView);
      }
   }, [isInView, context.message.isPreview]);

   return (
      <li className="group shrink-0 select-text" ref={context.ref} id={context.message.id}>
         {/* {context.message.isEditing && <EditMessage />} */}
         {(context.message.isPreview || [MessageType.DEFAULT].includes(context.message.type)) && <DefaultMessage />}
         {!context.message.isPreview &&
            [
               MessageType.RECIPIENT_ADD,
               MessageType.RECIPIENT_REMOVE,
               MessageType.CHANNEL_NAME_CHANGED,
               MessageType.CHANNEL_ICON_CHANGED,
               MessageType.CHANNEL_OWNER_CHANGED,
               MessageType.CALL,
            ].includes(context.message.type) && <ActionMessage />}
      </li>
   );
}

export default MessageRenderer;
