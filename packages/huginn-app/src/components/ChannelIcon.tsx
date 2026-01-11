import type { Snowflake } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import LoadingIcon from "./LoadingIcon";

export default function ChannelIcon(props: { channelId: Snowflake; iconHash?: string | null; size?: string; className?: string }) {
   const client = useClient();
   const imgRef = useRef<HTMLImageElement>(null);

   const [hasError, setHasError] = useState(true);
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
   }, [props.iconHash]);

   const { size = "2.25rem", className } = props;
   return (
      <div className={clsx("relative shrink-0", className)} style={{ width: size, height: size }}>
         {!isLoaded && props.iconHash && (
            <div className="bg-primary-900 absolute inset-0 flex items-center justify-center rounded-full">
               <LoadingIcon className="size-5" />
            </div>
         )}
         {props.iconHash ? (
            <img
               alt="channel-icon"
               src={client?.cdn.channelIcon(props.channelId, props.iconHash)}
               onError={onError}
               onLoad={onLoad}
               ref={imgRef}
               loading="lazy"
               className="h-full w-full rounded-full object-cover"
            />
         ) : !hasError && !props.iconHash && !isLoaded ? (
            <div className="bg-primary-700 h-full w-full rounded-full" />
         ) : (
            hasError && <div className="bg-negative-400 text-text flex h-full w-full items-center justify-center rounded-full font-bold">!</div>
         )}
      </div>
   );
}
