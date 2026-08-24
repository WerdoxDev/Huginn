import type { Snowflake } from "@huginnjs/shared";

import { useChannelBackgrounds } from "@hooks/useChannelBackgrounds";
import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import clsx from "clsx";

export default function ChannelBackground(props: { channelId: Snowflake }) {
   const { user } = useThisUser();
   const client = useClient();
   const { background, backgroundScope } = useChannelBackgrounds(props.channelId);
   const backgroundUrl = background?.image && user?.id ? client?.cdn.channelBackground(backgroundScope, user.id, background.image) : undefined;
   const portraitBackgroundUrl =
      background?.portraitImage && user?.id ? client?.cdn.channelBackground(backgroundScope, user.id, background.portraitImage) : undefined;
   const hasPortraitBackground = !!background?.portraitImage;

   return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ backgroundColor: background?.color }}>
         {background?.image && (
            <div
               className={clsx("pointer-events-none absolute bg-center bg-no-repeat", hasPortraitBackground && "portrait:hidden")}
               style={{
                  backgroundImage: `url(${backgroundUrl})`,
                  backgroundSize: background.imageDisplay ?? "cover",
                  filter: background.blur ? `blur(${background.blur}px)` : undefined,
                  inset: background.blur ? -background.blur * 2 : 0,
               }}
            />
         )}
         {background?.image && (
            <div
               className={clsx("pointer-events-none absolute inset-0 bg-black", hasPortraitBackground && "portrait:hidden")}
               style={{ opacity: background.dimming ? background.dimming / 100 : 0 }}
            />
         )}
         {background?.portraitImage && (
            <div
               className="pointer-events-none absolute bg-center bg-no-repeat portrait:block landscape:hidden"
               style={{
                  backgroundImage: `url(${portraitBackgroundUrl})`,
                  backgroundSize: background.portraitImageDisplay ?? "cover",
                  filter: background.portraitBlur ? `blur(${background.portraitBlur}px)` : undefined,
                  inset: background.portraitBlur ? -background.portraitBlur * 2 : 0,
               }}
            />
         )}
         {background?.portraitImage && (
            <div
               className="pointer-events-none absolute inset-0 hidden bg-black portrait:block"
               style={{ opacity: background.portraitDimming ? background.portraitDimming / 100 : 0 }}
            />
         )}
      </div>
   );
}
