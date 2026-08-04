import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { MessageReferenceType, type APIPostMessageReferenceJSONBody } from "@huginnjs/shared";
import { dispatchEvent } from "@lib/event-handler";
import { appendAppMessage, deleteAppMessage, findChannel, getChannels, updateAppMessage } from "@lib/query-utils";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { MessageErrorType, type PreviewAppMessage } from "@/types";

export function useSendMessage() {
   const client = useClient();
   const { user } = useThisUser();
   const queryClient = useQueryClient();
   const currentChannel = useCurrentChannel();
   const { updateMessageUploadProgress } = useChannelStore();
   const abortControllers = useRef(new Map<PreviewAppMessage["id"], AbortController>());

   const mutation = useMutation({
      mutationKey: ["send-message"],
      onMutate: async (data: { previewMessage: PreviewAppMessage }) => {
         const abortController = new AbortController();
         abortControllers.current.set(data.previewMessage.id, abortController);

         if (!user) return;

         const filenames = data.previewMessage.attachments?.map((x) => x.filename);

         const onAbort = () => {
            abortController.abort();
            deleteAppMessage(queryClient, data.previewMessage.channelId, data.previewMessage.id);
         };

         if (data.previewMessage.attachments?.length) {
            updateMessageUploadProgress({
               messageId: data.previewMessage.id,
               percentage: 0,
               total: 0,
               filenames,
               onAbort,
            });
         }

         const targetChannel = findChannel(getChannels(undefined, queryClient), data.previewMessage.channelId);
         appendAppMessage(queryClient, data.previewMessage.channelId, data.previewMessage, targetChannel, currentChannel);

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

         let messageReference: APIPostMessageReferenceJSONBody | undefined;
         if (previewMessage.referencedMessage) {
            messageReference = {
               channelId: previewMessage.referencedMessage?.channelId,
               messageId: previewMessage.referencedMessage?.id,
               type: MessageReferenceType.DEFAULT,
            };
         }

         const attachments = data.previewMessage.attachments?.map((x, i) => ({ ...x, id: i }));

         const message = await client!.channels.createMessage(
            data.previewMessage.channelId,
            {
               attachments:
                  attachments && attachments.length > 0
                     ? attachments?.map((x) => ({
                          id: x.id,
                          filename: x.filename,
                          description: x.description,
                       }))
                     : undefined,
               content: data.previewMessage.content,
               flags: data.previewMessage.flags,
               nonce: previewMessage.nonce,
               messageReference,
            },
            await Promise.all(
               attachments?.map(async (x) => ({
                  data: x.data instanceof Function ? await x.data() : x.data,
                  name: x.filename,
                  contentType: x.contentType,
               })) ?? [],
            ),
            data.previewMessage.attachments?.length
               ? (event) =>
                    updateMessageUploadProgress({
                       messageId: previewMessage.id,
                       percentage: (event.loaded / event.total) * 100,
                       total: event.total,
                    })
               : undefined,
            abortControllers.current.get(previewMessage.id)?.signal,
         );

         return { message };
      },
      onError(_error, data) {
         const targetChannel = findChannel(getChannels(undefined, queryClient), data.previewMessage.channelId);
         updateAppMessage(queryClient, {
            channelId: data.previewMessage.channelId,
            messageId: data.previewMessage.id,
            patch: { error: MessageErrorType.FAILED_TO_SEND },
            targetChannel,
            currentChannel,
         });
      },
      onSettled(_result, _error, data) {
         abortControllers.current.delete(data.previewMessage.id);
      },
      networkMode: "always",
   });

   return mutation;
}
