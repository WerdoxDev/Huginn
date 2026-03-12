import type { Snowflake } from "@huginn/shared";

import { presenceStatuses } from "@lib/utils";
import { useClient } from "@stores/clientStore";
import { usePresence } from "@stores/presenceStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import LoadingIcon from "./LoadingIcon";

export default function UserAvatar(props: {
   userId: Snowflake;
   avatarHash?: string | null;
   size?: string;
   statusSize?: string;
   className?: string;
   hideStatus?: boolean;
   test?: boolean;
}) {
   const client = useClient();
   const imgRef = useRef<HTMLImageElement>(null);
   const huginnWindow = useHuginnWindow();

   const presence = usePresence(props.userId);
   const [hasError, setHasError] = useState(false);
   const [isLoaded, setIsLoaded] = useState(false);

   function onLoad() {
      setIsLoaded(true);
      setHasError(false);
   }

   function onError() {
      setHasError(true);
   }

   useEffect(() => {
      setHasError(false);

      if (imgRef.current?.complete) {
         setIsLoaded(true);
      } else {
         setIsLoaded(false);
      }

      if (huginnWindow.environment !== "desktop") {
         return;
      }

      if (props.avatarHash && client) {
         window.electronAPI.saveImageToCache(client.cdn.avatar(props.userId, props.avatarHash, { size: 256, format: "png" }), props.avatarHash);
      }
   }, [props.avatarHash]);

   const { size = "2.25rem", statusSize = "0.75rem", className } = props;
   return (
      <div className={clsx("relative shrink-0", className)} style={{ width: size, height: size }}>
         {!isLoaded && props.avatarHash && (
            <div className="bg-primary-900 absolute inset-0 flex items-center justify-center rounded-full">
               <LoadingIcon className="size-5" />
            </div>
         )}
         {props.avatarHash ? (
            <img
               ref={imgRef}
               onLoad={onLoad}
               onError={onError}
               alt="user-avatar"
               src={client?.cdn.avatar(props.userId, props.avatarHash)}
               loading="lazy"
               className="h-full w-full rounded-full object-cover"
            />
         ) : !hasError && !props.avatarHash && !isLoaded ? (
            <div className="bg-primary-700 h-full w-full rounded-full" />
         ) : (
            hasError && <div className="bg-negative-400 text-text flex h-full w-full items-center justify-center rounded-full font-bold">!</div>
         )}
         {!props.hideStatus && (
            <div
               className={clsx(
                  "absolute right-0 bottom-0 rounded-full",
                  presence?.status && presence.status !== "offline" ? presenceStatuses[presence.status].color : "bg-transparent",
               )}
               style={{ width: statusSize, height: statusSize }}
            />
         )}
      </div>
   );
}
