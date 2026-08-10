import type { Snowflake } from "@huginnjs/shared";

import { useChannelBackgrounds } from "@hooks/useChannelBackgrounds";
import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";

export default function ChannelBackground(props: { channelId: Snowflake }) {
   const { user } = useThisUser();
   const client = useClient();
   const { background } = useChannelBackgrounds(props.channelId);
   const backgroundUrl = background?.image && user?.id ? client?.cdn.channelBackground(props.channelId, user?.id, background.image) : undefined;

   return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ backgroundColor: background?.color }}>
         {background?.image && (
            <div
               className="pointer-events-none absolute bg-center bg-no-repeat"
               style={{
                  backgroundImage: `url(${backgroundUrl})`,
                  backgroundSize: background.imageDisplay ?? "cover",
                  filter: background.blur ? `blur(${background.blur}px)` : undefined,
                  inset: background.blur ? -background.blur * 2 : 0,
               }}
            />
         )}
         {background?.image && (
            <div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: background.dimming ? background.dimming / 100 : 0 }} />
         )}
      </div>
   );
}
