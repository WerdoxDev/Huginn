import type { AppUser } from "@/types";
import LoadingIcon from "@components/LoadingIcon";
import Tooltip from "@components/tooltip/Tooltip";
import UserAvatar from "@components/UserAvatar";
import { useMutationLatestState } from "@hooks/useLatestMutationStatus";
import type { Snowflake, UserPresence } from "@huginn/shared";
import { RelationshipType } from "@huginn/shared";
import { useContextMenu } from "@stores/contextMenuStore";
import { type MouseEvent, useMemo } from "react";

export default function FriendItem(props: {
   type: RelationshipType;
   user: AppUser;
   presence?: UserPresence;
   onAccept?: (userId: Snowflake) => void;
   onDenyOrCancel?: (userId: Snowflake) => void;
   onMessage?: (userId: Snowflake) => void;
}) {
   const { open: openRelationshipMore } = useContextMenu("relationship_more");
   const { open: openRelationship } = useContextMenu("relationship");
   const createChannelState = useMutationLatestState("create-dm-channel_other");
   const createRelationshipState = useMutationLatestState("create-relationship");
   const removeRelationshipState = useMutationLatestState("remove-relationship");

   const loading = useMemo(
      () =>
         (createRelationshipState?.status === "pending" && createRelationshipState.variables?.userId === props.user.id) ||
         (removeRelationshipState?.status === "pending" && removeRelationshipState.variables === props.user.id) ||
         (createChannelState?.status === "pending" && createChannelState?.variables?.recipients.some((x) => x === props.user.id)),
      [createChannelState, createRelationshipState, removeRelationshipState],
   );

   const presenceText = useMemo(
      () =>
         !props.presence
            ? "Offline"
            : props.presence?.status === "online"
              ? "Online"
              : props.presence?.status === "offline"
                ? "Offline"
                : props.presence?.status === "idle"
                  ? "Idle"
                  : "Do not disturb",
      [props.presence],
   );

   return (
      // biome-ignore lint/a11y/noStaticElementInteractions: there is an inner button
      <div
         className="hover:bg-surface-alt group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-xl p-3"
         onContextMenu={(e: MouseEvent<HTMLDivElement>) => {
            openRelationship({ user: props.user, type: props.type }, e);
         }}
         onClick={(e) => {
            e.stopPropagation();
            props.onMessage?.(props.user.id);
         }}
      >
         <div className="flex">
            <UserAvatar userId={props.user.id} avatarHash={props.user.avatar} className="mr-3" />
            <div className="flex flex-col items-start">
               <span className="text-text font-semibold">{props.user.displayName}</span>
               <span className="text-text/50 text-sm">{presenceText}</span>
            </div>
         </div>
         {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
               <LoadingIcon className="size-10" />
            </div>
         )}
         <div className="flex shrink-0 items-center gap-x-2.5">
            {props.type === RelationshipType.PENDING_INCOMING || props.type === RelationshipType.PENDING_OUTGOING ? (
               <>
                  {props.type === RelationshipType.PENDING_INCOMING && (
                     <Tooltip>
                        <Tooltip.Trigger
                           className="bg-surface/50 text-text/80 hover:text-primary-700 group-hover:bg-surface rounded-full p-2"
                           onClick={(e) => {
                              e.stopPropagation();
                              props.onAccept?.(props.user.id);
                           }}
                        >
                           <IconMingcuteCheckFill className="size-5" />
                        </Tooltip.Trigger>
                        <Tooltip.Content>Accept</Tooltip.Content>
                     </Tooltip>
                  )}
                  <Tooltip>
                     <Tooltip.Trigger
                        className="bg-surface/50 text-text/80 hover:text-negative-100 group-hover:bg-surface rounded-full p-2"
                        onClick={() => props.onDenyOrCancel?.(props.user.id)}
                     >
                        <IconMingcuteCloseFill className="size-5" />
                     </Tooltip.Trigger>
                     <Tooltip.Content>{props.type === RelationshipType.PENDING_INCOMING ? "Ignore" : "Cancel"} </Tooltip.Content>
                  </Tooltip>
               </>
            ) : (
               <>
                  <Tooltip>
                     <Tooltip.Trigger
                        onClick={(e) => {
                           e.stopPropagation();
                           props.onMessage?.(props.user.id);
                        }}
                        className="bg-surface/50 text-text/80 hover:text-text rounded-full p-2 active:bg-white/20"
                     >
                        <IconMingcuteMessage1Fill className="size-5" />
                     </Tooltip.Trigger>
                     <Tooltip.Content>Message</Tooltip.Content>
                  </Tooltip>
                  <Tooltip>
                     <Tooltip.Trigger
                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                           e.stopPropagation();
                           openRelationshipMore({ user: props.user, type: props.type }, e);
                        }}
                        className="bg-surface/50 text-text/80 hover:text-text rounded-full p-2 active:bg-white/20"
                     >
                        <IconMingcuteMore2Fill className="size-5" />
                     </Tooltip.Trigger>
                     <Tooltip.Content>More</Tooltip.Content>
                  </Tooltip>
               </>
            )}
         </div>
      </div>
   );
}
