import type { Snowflake } from "@huginn/shared";

import { layout, prepare } from "@chenglou/pretext";
import UserAvatar from "@components/UserAvatar";
import { useUser } from "@hooks/api-hooks/userHooks";
import { getUserBannerOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useMemo } from "react";

export default function UserProfilePreview(props: { userId: Snowflake; className?: string; maxWidth?: number }) {
   const user = useUser(props.userId);
   const client = useClient();
   const { data: originalBanner } = useQuery(getUserBannerOptions(user?.id, user?.banner, client));

   const maxWidth = props.maxWidth ?? 144;

   const displayNameLineCount = useMemo(() => {
      const prepared = prepare(user.displayName ?? "", "600 16px Rubik");
      const { lineCount } = layout(prepared, maxWidth, 24);
      return lineCount;
   }, [user, maxWidth]);

   const usernameLineCount = useMemo(() => {
      const prepared = prepare(user.username ?? "", "14px Rubik");
      const { lineCount } = layout(prepared, maxWidth, 20);
      return lineCount;
   }, [user, maxWidth]);

   return (
      <div
         className={clsx(
            "bg-surface-alt relative flex shrink-0 items-center gap-x-2.5 overflow-hidden rounded-md border-2 px-2.5 py-2.5",
            props.className,
         )}
         style={{ borderColor: user.accentColor || "transparent" }}
      >
         {originalBanner ? (
            <img src={originalBanner} className="absolute inset-0 h-full w-full object-cover" />
         ) : (
            user.bannerColor && <div className="absolute inset-0 h-full w-full" style={{ backgroundColor: `${user.bannerColor}` }} />
         )}
         <div className="bg-surface-alt z-10 rounded-full p-0.5">
            <UserAvatar userId={props.userId} avatarHash={user.avatar} size={2.5} animatedMode="always" />
         </div>
         <div className="z-10 flex w-full flex-col overflow-hidden rounded-md bg-black/50 px-2 py-1 backdrop-blur-sm">
            <div
               className={clsx(
                  "font-semibold text-white",
                  displayNameLineCount > 1 ? "wrap-break-word whitespace-break-spaces" : "whitespace-nowrap",
               )}
               style={displayNameLineCount > 1 ? { maxWidth } : undefined}
            >
               {user.displayName}
            </div>
            <div
               className={clsx(
                  "overflow-hidden text-sm text-white",
                  usernameLineCount > 1 ? "wrap-break-word whitespace-break-spaces" : "whitespace-nowrap",
               )}
               style={usernameLineCount > 1 ? { maxWidth } : undefined}
            >
               {user.username}
            </div>
         </div>
      </div>
   );
}
