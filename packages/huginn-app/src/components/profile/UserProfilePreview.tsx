import type { Snowflake } from "@huginn/shared";

import { layout, prepare } from "@chenglou/pretext";
import UserAvatar from "@components/UserAvatar";
import UserBanner from "@components/UserBanner";
import { useUser } from "@hooks/api-hooks/userHooks";
import clsx from "clsx";
import { useMemo } from "react";

export default function UserProfilePreview(props: {
   userId: Snowflake;
   className?: string;
   textMaxWidth?: number;
   avatarImageSrc?: string | null;
   bannerImageSrc?: string | null;
}) {
   const user = useUser(props.userId);

   const maxWidth = props.textMaxWidth ?? 144;

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
         className={clsx("bg-surface-alt relative flex shrink-0 items-center gap-x-2.5 overflow-hidden rounded-md border-2 p-2.5", props.className)}
         style={{ borderColor: user.accentColor || "transparent" }}
      >
         <div className="absolute inset-0">
            <UserBanner
               userId={props.userId}
               animatedMode="always"
               bannerColor={user.bannerColor}
               bannerHash={user.banner}
               imageSrc={props.bannerImageSrc}
            />
         </div>
         <div className="z-10 rounded-full">
            <UserAvatar userId={props.userId} avatarHash={user.avatar} imageSrc={props.avatarImageSrc} size={2.5} animatedMode="always" />
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
