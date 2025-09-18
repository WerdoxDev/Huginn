import { useContextMenu } from "@stores/contextMenuStore";
import ContextMenu from "./ContextMenu";
import { useOpen } from "@hooks/useOpen";
import { useModals } from "@stores/modalsStore";
import { error } from "@huginn/shared";
import { useChannelStore } from "@stores/channelStore";
import { useThisUser } from "@stores/userStore";
import { useDeleteMessage } from "@hooks/mutations/useDeleteMessage";
import { useMemo } from "react";

export default function MessageContextMenu() {
   const { data } = useContextMenu("message");
   const { openUrl } = useOpen();
   const { showError } = useModals();
   const { setEditingMessageId, setReplyingMessageId } = useChannelStore();
   const { user } = useThisUser();
   const deleteMessageMutation = useDeleteMessage();

   const isAuthor = useMemo(() => data?.message.authorId === user?.id, [user, data]);

   function copyImage() {
      const img = data?.imgRef?.current;

      if (!img) {
         return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const context = canvas.getContext("2d");

      if (!context) {
         return;
      }

      context.drawImage(img, 0, 0);

      try {
         canvas.toBlob(async (blob) => {
            if (!blob) {
               return;
            }

            try {
               await navigator.clipboard.write([new ClipboardItem({ [blob?.type]: blob })]);
            } catch (e) {
               console.log(e);
            }
         });
      } catch (e) {
         showError("Failed to copy image");
         error("app:general", e);
      }
   }

   function deleteMessage() {
      if (deleteMessageMutation.isPending || !data) {
         return;
      }

      deleteMessageMutation.mutate({ channelId: data.message.channelId, messageId: data.message.id });
   }

   if (!data) {
      return;
   }

   return (
      <>
         {isAuthor && (
            <ContextMenu.Item label="Edit Message" onClick={() => setEditingMessageId(data.message.id)}>
               <IconMingcuteEdit2Fill />
            </ContextMenu.Item>
         )}
         <ContextMenu.Item label="Reply" onClick={() => setReplyingMessageId(data.message.id)}>
            <IconMingcuteCornerUpLeftFill />
         </ContextMenu.Item>
         <ContextMenu.Divider />
         <ContextMenu.Item label="Copy Text" onClick={() => navigator.clipboard.writeText(data.message.content)}>
            <IconMingcuteCopy2Fill />
         </ContextMenu.Item>
         <ContextMenu.Item label="Copy Message Link (soon)" disabled>
            <IconMingcuteLink2Fill />
         </ContextMenu.Item>
         <ContextMenu.Item label="Pin Message (soon)" disabled>
            <IconMingcutePinFill />
         </ContextMenu.Item>
         {isAuthor && (
            <>
               <ContextMenu.Divider />
               <ContextMenu.Item color="negative" label="Delete Message" onClick={deleteMessage}>
                  <IconMingcuteDelete3Fill />
               </ContextMenu.Item>
            </>
         )}
         {data.imgRef?.current && (
            <>
               <ContextMenu.Divider />
               <ContextMenu.Item label="Copy Image" onClick={copyImage} />
            </>
         )}
         {data.url && (
            <>
               <ContextMenu.Divider />
               <ContextMenu.Item label="Copy Link" onClick={() => navigator.clipboard.writeText(data.url ?? "")} />
               <ContextMenu.Item label="Open Link" onClick={() => openUrl(data.url ?? "")} />
            </>
         )}
         <ContextMenu.Divider />
         <ContextMenu.Item label="Copy Message ID" onClick={() => navigator.clipboard.writeText(data.message.id)}>
            <IconMingcuteIdcardFill />
         </ContextMenu.Item>
      </>
   );
}
