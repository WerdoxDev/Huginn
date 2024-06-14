import UserIconWithStatus from "@components/UserIconWithStatus";
import { APIRelationUser, RelationshipType } from "@shared/api-types";
import { Snowflake } from "@shared/snowflake";

export default function FriendItem(props: {
   type: RelationshipType;
   user: APIRelationUser;
   onAccept?: (userId: Snowflake) => void;
   onDenyOrCancel?: (userId: Snowflake) => void;
}) {
   return (
      <div className="group flex cursor-pointer items-center justify-between rounded-xl p-2.5 hover:bg-secondary">
         <div className="flex">
            <UserIconWithStatus className="mr-3 bg-text" />
            <div className="flex flex-col items-start">
               <span className="font-semibold text-text">{props.user.username}</span>
               <span className="text-sm text-text/50">Online (?)</span>
            </div>
         </div>
         <div className="flex flex-shrink-0 gap-x-2.5">
            {props.type === RelationshipType.PENDING_INCOMING || props.type === RelationshipType.PENDING_OUTGOING ? (
               <>
                  {props.type === RelationshipType.PENDING_INCOMING && (
                     <button
                        className="rounded-full bg-background/50 p-2 text-text/75 hover:text-primary group-hover:bg-background"
                        onClick={() => props.onAccept && props.onAccept(props.user.id)}
                     >
                        <IconMdiCheck className="size-5" />
                     </button>
                  )}
                  <button
                     className="rounded-full bg-background/50 p-2 text-text/75 hover:text-error group-hover:bg-background"
                     onClick={() => props.onDenyOrCancel && props.onDenyOrCancel(props.user.id)}
                  >
                     <IconMdiClose className="size-5" />
                  </button>
               </>
            ) : (
               <>
                  <button className="rounded-full bg-background/50 p-2 text-text/75 hover:text-text group-hover:bg-background">
                     <IconMdiMessage className="size-5" />
                  </button>
                  <button className="rounded-full bg-background/50 p-2 text-text/75 hover:text-text group-hover:bg-background">
                     <IconMdiMoreVert className="size-5" />
                  </button>
               </>
            )}
         </div>
      </div>
   );
}
