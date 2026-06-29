import HuginnButton from "@components/button/HuginnButton";
import { MessageContext } from "@contexts/MessageProvider";
import { useAddReaction } from "@hooks/mutations/useAddReaction";
import { useIsInView } from "@hooks/useIsInView";
import { MessageType } from "@huginn/shared";
import { useContext, useEffect } from "react";

import ActionMessage from "./ActionMessage";
import DefaultMessage from "./DefaultMessage";
import { MessageActions } from "./MessageActions";

function MessageRenderer() {
   const context = useContext(MessageContext);
   const isInView = useIsInView(context.ref);
   const mutation = useAddReaction();

   useEffect(() => {
      if (!context.message.isPreview) {
         context.onVisibilityChanged?.((context.options?.idPrefix ?? "") + context.message.id, isInView);
      }
   }, [isInView, context.message.isPreview]);

   async function handleAddReaction(emojiId: string | null, emojiName: string) {
      await mutation.mutateAsync({
         channelId: context.message.channelId,
         messageId: context.message.id,
         emojiId: emojiId,
         emojiName: emojiName,
      });
   }

   return (
      <li className="group relative shrink-0 select-text" ref={context.ref} id={(context.options?.idPrefix ?? "") + context.message.id}>
         {/* <div className="absolute top-0 right-10 z-10">
            <HuginnButton className="px-2 py-1" color="primary" onClick={() => handleAddReaction(null, "😎")}>
               Test
            </HuginnButton>
         </div> */}
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
