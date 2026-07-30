import { useChannel } from "@hooks/api-hooks/channelHooks";
import { useMaybeUser } from "@hooks/api-hooks/userHooks";
import { ChannelType, type Snowflake } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import { clsx } from "clsx";

export default function MessageMentionElement(
   props:
      | {
           mentionType: "user";
           userId: Snowflake;
        }
      | {
           mentionType: "everyone";
           usedText: string;
        }
      | {
           mentionType: "owner";
           channelId?: Snowflake;
           usedText: string;
        },
) {
   const channel = useChannel(props.mentionType === "owner" ? props.channelId : undefined);
   const user = useMaybeUser(
      props.mentionType === "user"
         ? props.userId
         : props.mentionType === "owner" && channel?.type === ChannelType.GROUP_DM
           ? channel.ownerId
           : undefined,
   );

   const { updateModals } = useModals();

   function handleClick() {
      if ((props.mentionType === "user" || props.mentionType === "owner") && user) {
         updateModals({ userProfile: { isOpen: true, userId: user.id } });
      }
   }

   return (
      <button
         className={clsx(
            "ring-primary-500 inline-block rounded px-1 align-baseline text-white ring-1",
            (props.mentionType === "user" || props.mentionType === "owner") && "hover:bg-primary-700 cursor-pointer",
         )}
         type="button"
         onClick={handleClick}
      >
         {props.mentionType === "user" && "@" + (user?.displayName ?? "unknown-user")}
         {(props.mentionType === "everyone" || props.mentionType === "owner") && "@" + props.usedText}
      </button>
   );
}
