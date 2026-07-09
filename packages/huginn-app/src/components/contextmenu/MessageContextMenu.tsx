import EmojiImg from "@components/EmojiImg";
import { useAddReaction } from "@hooks/mutations/useAddReaction";
import { useDeleteMessage } from "@hooks/mutations/useDeleteMessage";
import { usePinMessage } from "@hooks/mutations/usePinMessage";
import { useUnpinMessage } from "@hooks/mutations/useUnpinMessage";
import { useOpen } from "@hooks/useOpen";
import { useRecentEmojis } from "@hooks/useRecentEmojis";
import { error } from "@huginn/shared";
import { deleteAppMessage } from "@lib/query-utils";
import { useChannelStore } from "@stores/channelStore";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import { usePopover } from "@stores/popoverStore";
import { useThisUser } from "@stores/userStore";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import ContextMenu from "./ContextMenu";

export default function MessageContextMenu() {
   const { data, close } = useContextMenu("message");
   const { toggle: toggleExpression } = usePopover("expression");
   const { openUrl } = useOpen();
   const { showError } = useModals();
   const queryClient = useQueryClient();
   const { setEditingMessageId, setReplyingMessageId } = useChannelStore();
   const { user } = useThisUser();
   const deleteMessageMutation = useDeleteMessage();
   const pinMessageMutation = usePinMessage();
   const unpinMessageMutation = useUnpinMessage();
   const addReactionMutation = useAddReaction();
   const { recentEmojis, addRecentEmoji } = useRecentEmojis();

   const isAuthor = useMemo(() => data?.message.authorId === user?.id, [user, data]);
   const isPinned = useMemo(() => data?.message.isPreview === false && data.message.pinned, [data]);
   const isPinning = pinMessageMutation.isPending || unpinMessageMutation.isPending;

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

   async function deleteMessage() {
      if (deleteMessageMutation.isPending || !data) return;

      if (data.message.isPreview) {
         deleteAppMessage(queryClient, data.message.channelId, data.message.id);
         return;
      }

      await deleteMessageMutation.mutateAsync({
         channelId: data.message.channelId,
         messageId: data.message.id,
      });
   }

   async function togglePin() {
      if (!data) return;

      if (isPinned) {
         if (unpinMessageMutation.isPending) return;

         await unpinMessageMutation.mutateAsync({
            channelId: data.message.channelId,
            messageId: data.message.id,
         });

         return;
      }

      if (pinMessageMutation.isPending) return;

      await pinMessageMutation.mutateAsync({
         channelId: data.message.channelId,
         messageId: data.message.id,
      });
   }

   function handleReply() {
      if (!data) return;
      close();
      setReplyingMessageId(data.message.id);
   }

   async function handleEmojiSelect(slug: string, unicode?: string) {
      if (!unicode || !data) return;

      close();
      addRecentEmoji(slug);
      await addReactionMutation.mutateAsync({
         channelId: data.message.channelId,
         messageId: data.message.id,
         emojiId: null,
         emojiName: unicode,
      });
   }

   if (!data) return;

   return (
      <>
         {recentEmojis.length !== 0 && (
            <div className="mb-2 flex w-full items-center justify-between">
               {recentEmojis.slice(0, 6).map((emoji) => (
                  <button
                     key={emoji.slugs[0]}
                     className="hover:bg-surface-alt active:bg-surface-alt bg-surface-deep shrink-0 cursor-pointer rounded p-3 lg:p-1.5"
                     onClick={() => handleEmojiSelect(emoji.slugs[0], emoji.unicode)}
                  >
                     <EmojiImg unicode={emoji.unicode} className="size-6 lg:size-5.5" />
                  </button>
               ))}
            </div>
         )}
         <ContextMenu.Item label="Add Reaction" onClick={(e) => toggleExpression(e, { type: "emoji", onEmojiSelect: handleEmojiSelect })}>
            <IconMingcuteEmoji2Fill />
         </ContextMenu.Item>
         {isAuthor && !data.message.isPreview && (
            <ContextMenu.Item label="Edit Message" onClick={() => setEditingMessageId(data.message.id)}>
               <IconMingcuteEdit2Fill />
            </ContextMenu.Item>
         )}
         {!data.message.isPreview && (
            <>
               <ContextMenu.Item label="Reply" onClick={handleReply}>
                  <IconMingcuteCornerUpLeftFill />
               </ContextMenu.Item>
               <ContextMenu.Divider />
            </>
         )}
         <ContextMenu.Item label="Copy Text" onClick={() => navigator.clipboard.writeText(data.message.content)}>
            <IconMingcuteCopy2Fill />
         </ContextMenu.Item>
         <ContextMenu.Item label="Copy Message Link (soon)" disabled>
            <IconMingcuteLink2Fill />
         </ContextMenu.Item>
         {!data.message.isPreview && (
            <ContextMenu.Item label={isPinned ? "Unpin Message" : "Pin Message"} onClick={togglePin} disabled={isPinning}>
               <IconMingcutePinFill />
            </ContextMenu.Item>
         )}
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
