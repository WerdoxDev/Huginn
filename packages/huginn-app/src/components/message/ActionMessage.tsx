import Tooltip from "@components/tooltip/Tooltip";
import { MessageContext } from "@contexts/MessageProvider";
import { useUser, useUsers } from "@hooks/api-hooks/userHooks";
import { MessageType } from "@huginn/shared";
import clsx from "clsx";
import moment from "moment";
import { useContext, useMemo } from "react";

export default function ActionMessage() {
   const context = useContext(MessageContext);

   const message = useMemo(() => context.message, [context.message]);
   const author = useUser(message.authorId);
   const authorName = useMemo(() => author?.displayName, [context.message]);
   const mentionUsers = useUsers(!message.isPreview ? message.mentions : undefined);
   const formattedFullTime = useMemo(() => moment(context.message?.timestamp).format("DD.MM.YYYY HH:mm"), [context.message]);

   const isLastAction = useMemo(() => context.lastMessage?.isActionType || !context.lastMessage, [context.lastMessage]);
   const isNextAction = useMemo(() => context.nextMessage?.isActionType || !context.nextMessage, [context.nextMessage]);
   const isUnread = useMemo(() => context.message.isUnread, [context.message]);

   const type = useMemo(() => !message.isPreview && message.type, [context.message]);
   const call = useMemo(() => (!message.isPreview && message.type === MessageType.CALL ? message.call : undefined), [message]);

   const callParticipants = useUsers(call?.participants);

   function formatCallDuration() {
      if (context.message.isPreview || context.message.type !== MessageType.CALL) {
         return;
      }

      const startTime = context.message.timestamp;
      const endTime = context.message.call.endedTimestamp;

      if (!endTime) {
         return;
      }

      const duration = moment.duration(moment(endTime).diff(moment(startTime)));

      if (duration.asHours() >= 1) {
         return `${Math.floor(duration.asHours())} hour${duration.asHours() >= 2 ? "s" : ""}`;
      }
      if (duration.asMinutes() >= 1) {
         return `${Math.floor(duration.asMinutes())} minute${duration.asMinutes() >= 2 ? "s" : ""}`;
      }
      return `${Math.floor(duration.asSeconds())} second${duration.asSeconds() >= 2 ? "s" : ""}`;
   }

   return (
      <div
         className={clsx(
            "text-text hover:bg-surface-alt flex items-center rounded-r-md py-0.5 pl-4",
            !isLastAction && !context.message.hasNewDate && !isUnread && "mt-1.5",
            !isNextAction && !isUnread && "mb-1.5",
         )}
      >
         {type === MessageType.RECIPIENT_REMOVE && <IconMingcuteArrowLeftFill className="text-negative-100 mr-4 size-5 shrink-0" />}
         {type === MessageType.RECIPIENT_ADD && <IconMingcuteArrowRightFill className="text-positive-100 mr-4 size-5 shrink-0" />}
         {type === MessageType.CHANNEL_NAME_CHANGED && <IconMingcuteEdit2Fill className="text-text/80 mr-4 size-5 shrink-0" />}
         {type === MessageType.CHANNEL_ICON_CHANGED && <IconMingcutePic2Fill className="text-text/80 mr-4 size-5 shrink-0" />}
         {type === MessageType.CHANNEL_OWNER_CHANGED && <IconMingcuteTransfer3Fill className="text-primary-500 mr-4 size-5 shrink-0" />}
         {type === MessageType.CALL && <IconMingcutePhoneFill className="text-positive-100 mr-4 size-5 shrink-0" />}
         <div className="flex gap-x-1">
            <span className="font-bold">{authorName}</span>
            {type === MessageType.CALL && (
               <Tooltip>
                  <Tooltip.Trigger className="cursor-default! text-left">
                     <span className="text-text/50">started a call{call?.endedTimestamp ? ` that lasted ${formatCallDuration()}` : ""}.</span>
                  </Tooltip.Trigger>
                  {call?.endedTimestamp && call.participants.length !== 0 && (
                     <Tooltip.Content className="px-1.5! py-1.5!">
                        <div className="flex gap-x-1.5">
                           {callParticipants.map((x) => (
                              <div key={x.id} className="bg-surface rounded-sm px-1">
                                 {x.displayName}
                              </div>
                           ))}
                        </div>
                     </Tooltip.Content>
                  )}
               </Tooltip>
            )}
            {type === MessageType.CHANNEL_ICON_CHANGED && <span className="text-text/50"> changed the channel icon.</span>}
            {type === MessageType.CHANNEL_NAME_CHANGED &&
               (!context.message.content ? (
                  <span className="text-text/50"> removed the channel name.</span>
               ) : (
                  <>
                     <span className="text-text/50"> changed the chanel name: </span>
                     <span className="text-text font-bold">{message.content}</span>
                  </>
               ))}
            {mentionUsers[0] ? (
               <>
                  {type === MessageType.RECIPIENT_ADD && <span className="text-text/50"> added </span>}
                  {type === MessageType.RECIPIENT_REMOVE && <span className="text-text/50"> removed </span>}
                  {type === MessageType.CHANNEL_OWNER_CHANGED && <span className="text-text/50"> promoted </span>}
                  <span className="font-bold">{mentionUsers[0].displayName}</span>
                  {type === MessageType.CHANNEL_OWNER_CHANGED && (
                     <span className="text-text/50">
                        {" "}
                        to <span className="text-primary-500">Channel Owner</span>
                     </span>
                  )}
               </>
            ) : (
               type === MessageType.RECIPIENT_REMOVE && <span className="text-text/50"> left the group</span>
            )}
         </div>
         <div className="text-text/50 ml-2 text-xs">{formattedFullTime}</div>
      </div>
   );
}
