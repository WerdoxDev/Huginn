import type { Snowflake } from "@huginn/shared";
import { getUserAvatarOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { usePresence } from "@stores/presenceStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useState } from "react";
import LoadingIcon from "./LoadingIcon";
import { useHuginnWindow } from "@stores/windowStore";

export default function UserAvatar(props: {
   userId: Snowflake;
   avatarHash?: string | null;
   size?: string;
   statusSize?: string;
   className?: string;
   hideStatus?: boolean;
}) {
   const client = useClient();
   const huginnWindow = useHuginnWindow();
   const { data: avatar, isLoading } = useQuery(getUserAvatarOptions(props.userId, props.avatarHash, client));

   const presence = usePresence(props.userId);
   const [hasErrors, setHasErrors] = useState(false);

   useEffect(() => {
      setHasErrors(false);

      if (huginnWindow.environment !== "desktop") {
         return;
      }

      if (avatar && props.avatarHash) {
         window.electronAPI.saveHashImageToCache(avatar, props.avatarHash);
      }
   }, [avatar]);

   const { size = "2.25rem", statusSize = "0.75rem", className } = props;
   return (
      <div className={clsx("relative shrink-0", className)} style={{ width: size, height: size }}>
         {isLoading && (
            <div className="bg-primary-900 absolute inset-0 flex items-center justify-center rounded-full">
               <LoadingIcon className="size-5" />
            </div>
         )}
         {avatar && !hasErrors ? (
            <img alt="user-avatar" src={avatar} onError={() => setHasErrors(true)} className="h-full w-full rounded-full object-cover" />
         ) : !hasErrors && !avatar && !isLoading ? (
            <div className="bg-primary-700 h-full w-full rounded-full" />
         ) : (
            hasErrors && <div className="bg-negative-400 text-text flex h-full w-full items-center justify-center rounded-full font-bold">!</div>
         )}
         {!props.hideStatus && (
            <div
               className={clsx(
                  "absolute bottom-0 right-0 rounded-full",
                  presence ? (presence.status === "online" ? "bg-positive-100" : "bg-transparent") : "bg-transparent",
               )}
               style={{ width: statusSize, height: statusSize }}
            />
         )}
      </div>
   );
}
