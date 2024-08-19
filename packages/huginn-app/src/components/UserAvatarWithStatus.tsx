import { useClient } from "@contexts/apiContext";
import { Snowflake } from "@huginn/shared";
import clsx from "clsx";

export default function UserAvatarWithStatus(props: {
   userId: Snowflake;
   avatarHash?: string;
   size?: string;
   statusSize?: string;
   className?: string;
}) {
   const client = useClient();

   const { size = "2.25rem", statusSize = "0.75rem", className } = props;
   return (
      <div className={clsx("bg-background relative shrink-0 rounded-full", className)} style={{ width: size, height: size }}>
         {props.avatarHash ? (
            <img src={client.cdn.avatar(props.userId, props.avatarHash)} className="rounded-full"></img>
         ) : (
            <div></div>
         )}
         <div className="absolute bottom-0 right-0 rounded-full bg-[#FFA000]" style={{ width: statusSize, height: statusSize }} />
      </div>
   );
}
