import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { type APIPostMessageReferenceJSONBody, type MessageFlags, type Snowflake } from "@huginn/shared";
import { dispatchEvent } from "@lib/event-handler";
import { appendAppMessage, deleteAppMessage, findChannel, getChannels, updateAppMessage } from "@lib/query-utils";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { MessageErrorType, type AppAttachment, type PreviewAppMessage } from "@/types";

export function useSendMessage() {
   const client = useClient();
   const { user } = useThisUser();
   const queryClient = useQueryClient();
   const currentChannel = useCurrentChannel();
   const { updateMessageUploadProgress } = useChannelStore();

   const mutation = useMutation({
      mutationKey: ["send-message"],
      onMutate: async (data: {
         previewMessage: PreviewAppMessage;
         channelId: Snowflake;
         content: string;
         flags: MessageFlags;
         attachments: AppAttachment[];
         messageReference?: APIPostMessageReferenceJSONBody;
      }) => {
         if (!user) return;

         const filenames = data.attachments.map((x) => x.filename);

         const onAbort = () => {
            data.previewMessage.abortController?.abort();
            deleteAppMessage(queryClient, data.channelId, data.previewMessage.id);
         };

         if (data.attachments.length) {
            updateMessageUploadProgress({
               messageId: data.previewMessage.id,
               percentage: 0,
               total: 0,
               filenames,
               onAbort,
            });
         }

         const targetChannel = findChannel(getChannels(undefined, queryClient), data.channelId);
         appendAppMessage(queryClient, data.channelId, data.previewMessage, targetChannel, currentChannel);

         dispatchEvent("message_added", {
            message: data.previewMessage,
            inLoadedQueryPage: true,
            visible: true,
            self: true,
            inVisibleQueryPage: true,
         });

         return {
            filenames,
         };
      },

      mutationFn: async (data) => {
         const { previewMessage } = data;

         const message = await client!.channels.createMessage(
            data.channelId,
            {
               attachments: data.attachments.map((x) => ({
                  id: x.id,
                  filename: x.filename,
                  description: x.description,
               })),
               content: data.content,
               flags: data.flags,
               nonce: previewMessage.nonce,
               messageReference: data.messageReference,
            },
            data.attachments.map((x) => ({
               data: x.data,
               name: x.filename,
               contentType: x.contentType,
            })),
            data.attachments.length
               ? (event) =>
                    updateMessageUploadProgress({
                       messageId: previewMessage.id,
                       percentage: (event.loaded / event.total) * 100,
                       total: event.total,
                    })
               : undefined,
            previewMessage.abortController?.signal,
         );

         return { message };
      },
      onError(_error, data) {
         const targetChannel = findChannel(getChannels(undefined, queryClient), data.channelId);
         updateAppMessage(queryClient, {
            channelId: data.channelId,
            messageId: data.previewMessage.id,
            patch: { error: MessageErrorType.FAILED_TO_SEND },
            targetChannel,
            currentChannel,
         });
      },
      networkMode: "always",
   });

   return mutation;
}
