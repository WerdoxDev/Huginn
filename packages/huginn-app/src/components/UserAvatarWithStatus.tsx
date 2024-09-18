import { useClient } from "@contexts/apiContext";
import { Snowflake } from "@huginn/shared";
import { getUserAvatar } from "@lib/queries";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useState } from "react";

export default function UserAvatarWithStatus(props: {
   userId: Snowflake;
   avatarHash?: string | null;
   size?: string;
   statusSize?: string;
   className?: string;
}) {
   const client = useClient();

   const { data: avatar } = useQuery(getUserAvatar(props.userId, props.avatarHash, client));

   const [hasErrors, setHasErrors] = useState(false);

   const { size = "2.25rem", statusSize = "0.75rem", className } = props;
   return (
      <div className={clsx("relative shrink-0", className)} style={{ width: size, height: size }}>
         {avatar && !hasErrors ? (
            <img src={avatar} onError={() => setHasErrors(true)} className="h-full w-full rounded-full object-cover"></img>
         ) : !hasErrors && !avatar ? (
            <div className="bg-primary/50 h-full w-full rounded-full"></div>
         ) : (
            <div className="bg-error/50 text-text flex h-full w-full items-center justify-center rounded-full font-bold">!</div>
         )}
         <div className="absolute bottom-0 right-0 rounded-full bg-[#FFA000]" style={{ width: statusSize, height: statusSize }} />
      </div>
   );
}
