import { ContextMenuRelationship, ContextMenuType } from "@/types";
import UserIconWithStatus from "@components/UserIconWithStatus";
import { Tooltip } from "@components/tooltip/Tooltip";
import { useContextMenu } from "@contexts/contextMenuContext";
import { APIRelationUser, RelationshipType } from "@shared/api-types";
import { Snowflake } from "@shared/snowflake";

export default function FriendItem(props: {
   type: RelationshipType;
   user: APIRelationUser;
   onAccept?: (userId: Snowflake) => void;
   onDenyOrCancel?: (userId: Snowflake) => void;
   onMessage?: (userId: Snowflake) => void;
}) {
   const { open: openRelationshipMore } = useContextMenu<ContextMenuRelationship>(ContextMenuType.RELATIONSHIP_MORE);
   const { open: openRelationship } = useContextMenu<ContextMenuRelationship>(ContextMenuType.RELATIONSHIP);

   return (
      <div
         className="group flex cursor-pointer items-center justify-between rounded-xl p-2.5 hover:bg-secondary"
         onContextMenu={(e) => openRelationship({ user: props.user, type: props.type }, e)}
      >
         <div className="flex">
            <UserIconWithStatus className="mr-3 bg-text" />
            <div className="flex flex-col items-start">
               <span className="font-semibold text-text">{props.user.displayName}</span>
               <span className="text-sm text-text/50">Online (?)</span>
            </div>
         </div>
         <div className="flex flex-shrink-0 gap-x-2.5">
            {props.type === RelationshipType.PENDING_INCOMING || props.type === RelationshipType.PENDING_OUTGOING ? (
               <>
                  {props.type === RelationshipType.PENDING_INCOMING && (
                     <Tooltip>
                        <Tooltip.Trigger
                           className="rounded-full bg-background/50 p-2 text-text/80 hover:text-primary group-hover:bg-background"
                           onClick={() => props.onAccept && props.onAccept(props.user.id)}
                        >
                           <IconMdiCheck className="size-5" />
                        </Tooltip.Trigger>
                        <Tooltip.Content>Accept</Tooltip.Content>
                     </Tooltip>
                  )}
                  <Tooltip>
                     <Tooltip.Trigger
                        className="rounded-full bg-background/50 p-2 text-text/80 hover:text-error group-hover:bg-background"
                        onClick={() => props.onDenyOrCancel && props.onDenyOrCancel(props.user.id)}
                     >
                        <IconMdiClose className="size-5" />
                     </Tooltip.Trigger>
                     <Tooltip.Content>{props.type === RelationshipType.PENDING_INCOMING ? "Ignore" : "Cancel"} </Tooltip.Content>
                  </Tooltip>
               </>
            ) : (
               <>
                  <Tooltip>
                     <Tooltip.Trigger
                        onClick={() => props.onMessage && props.onMessage(props.user.id)}
                        className="rounded-full bg-background/50 p-2 text-text/80 hover:text-text active:bg-white/20"
                     >
                        <IconMdiMessage className="size-5" />
                     </Tooltip.Trigger>
                     <Tooltip.Content>Message</Tooltip.Content>
                  </Tooltip>
                  <Tooltip>
                     <Tooltip.Trigger
                        onClick={(e) => openRelationshipMore({ user: props.user, type: props.type }, e)}
                        className="rounded-full bg-background/50 p-2 text-text/80 hover:text-text active:bg-white/20"
                     >
                        <IconMdiMoreVert className="size-5" />
                     </Tooltip.Trigger>
                     <Tooltip.Content>More</Tooltip.Content>
                  </Tooltip>
               </>
            )}
         </div>
      </div>
   );
}
