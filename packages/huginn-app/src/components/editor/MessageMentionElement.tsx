import type { Snowflake } from "@huginn/shared";

import { useMaybeUser } from "@hooks/api-hooks/userHooks";
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
        },
) {
   const user = useMaybeUser(props.mentionType === "user" ? props.userId : undefined);
   const { updateModals } = useModals();

   function handleClick() {
      if (props.mentionType === "user" && user) {
         updateModals({ userProfile: { isOpen: true, userId: user.id } });
      }
   }

   return (
      <button
         className={clsx(
            "ring-primary-500 inline-block rounded px-1 align-baseline text-white ring-1",
            props.mentionType === "user" && "hover:bg-primary-700 cursor-pointer",
         )}
         type="button"
         onClick={handleClick}
      >
         {props.mentionType === "user" && "@" + (user?.displayName ?? "unknown-user")}
         {props.mentionType === "everyone" && "@" + props.usedText}
      </button>
   );
}
