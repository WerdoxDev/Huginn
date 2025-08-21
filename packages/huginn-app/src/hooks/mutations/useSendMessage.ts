import { type MessageFlags, type Snowflake, snowflake, WorkerID } from "@huginn/shared";
import { dispatchEvent } from "@lib/event-handler";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { type InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AppAttachment, AppMessage } from "@/types";
import { findChannel, getChannels } from "@lib/query-utils";

export function useSendMessage() {
   const client = useClient();
   const { user } = useThisUser();
   const queryClient = useQueryClient();
   const { updateMessageUploadProgress } = useChannelStore();

   const mutation = useMutation({
      mutationKey: ["send-message"],
      async mutationFn(data: { channelId: Snowflake; content: string; flags: MessageFlags; attachments: AppAttachment[] }) {
         if (!user) return;

         const nonce = client?.generateNonce();

         const previewMessage: AppMessage = {
            isPreview: true,
            id: snowflake.generateString(WorkerID.APP),
            timestamp: new Date(Date.now()).toISOString(),
            content: data.content,
            channelId: data.channelId,
            authorId: user.id,
            nonce: nonce,
         };

         const filenames = data.attachments.map((x) => x.filename);

         const abortController = new AbortController();

         function onAbort() {
            abortController.abort();

            queryClient.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", data.channelId], (old) => {
               if (!old) return undefined;

               const lastPage = old.pages[old.pages.length - 1];

               return {
                  ...old,
                  pages: old.pages.toSpliced(
                     old.pages.length - 1,
                     1,
                     lastPage.filter((x) => x.id !== previewMessage.id),
                  ),
               };
            });
         }

         if (data.attachments.length) {
            updateMessageUploadProgress({ messageId: previewMessage.id, percentage: 0, filenames, total: 0, onAbort });
         }

         const targetChannel = findChannel(getChannels(undefined, queryClient), data.channelId);

         // Add Preview Message
         queryClient.setQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", data.channelId], (old) => {
            if (!old) return undefined;

            const lastPage = old.pages[old.pages.length - 1];
            const lastParams = old.pageParams[old.pageParams.length - 1];

            if (!lastParams.before && (!lastParams.after || lastPage.some((x) => x.id === targetChannel?.lastMessageId))) {
               return {
                  ...old,
                  pages: old.pages.toSpliced(old.pages.length - 1, 1, [...lastPage, previewMessage]),
               };
            }

            return old;
         });

         dispatchEvent("message_added", { message: previewMessage, inLoadedQueryPage: true, visible: true, self: true, inVisibleQueryPage: true });

         return {
            previewMessage,
            message: await client?.channels.createMessage(
               data.channelId,
               {
                  attachments: data.attachments.map((x) => ({ id: x.id, filename: x.filename, description: x.description })),
                  content: data.content,
                  flags: data.flags,
                  nonce: nonce,
               },
               data.attachments.map((x) => ({ data: x.data, name: x.filename, contentType: x.contentType })),
               data.attachments.length
                  ? (event) =>
                     updateMessageUploadProgress({
                        messageId: previewMessage.id,
                        percentage: (event.loaded / event.total) * 100,
                        filenames,
                        total: event.total,
                        onAbort,
                     })
                  : undefined,
               abortController.signal,
            ),
         };
      },
   });

   return mutation;
}
